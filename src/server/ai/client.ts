import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import type { Source } from '../../shared/api.js';
import { HttpError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

/** A multimodal input part. `data` is base64. */
export type AiPart =
  | { type: 'text'; text: string }
  | { type: 'image' | 'document' | 'audio'; data: string; mime_type: string };

export interface Turn {
  role: 'user' | 'model';
  text: string;
}

export type Thinking = 'low' | 'medium' | 'high';

export interface AiRequest {
  /** Fixed instructions for the task; never contains user-supplied text. */
  system: string;
  input: string | AiPart[];
  thinking?: Thinking;
  maxOutputTokens?: number;
  /** Accept an empty reply (e.g. transcribing silence) instead of treating it as a failure. */
  allowEmpty?: boolean;
  /** Official pages the model must read (Gemini url_context). Reported back as `sources`. */
  groundingUrls?: readonly string[];
  signal?: AbortSignal;
}

export interface FunctionDecl {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatRequest {
  system: string;
  turns: Turn[];
  functions: readonly FunctionDecl[];
  groundingUrls?: readonly string[];
  signal?: AbortSignal;
}

export type ChatPart =
  | { type: 'text'; text: string }
  | { type: 'call'; name: string; args: Record<string, unknown> }
  | { type: 'sources'; sources: Source[] };

/** The only surface the routes depend on, so tests can inject a deterministic fake. */
export interface AiClient {
  generateText(req: AiRequest): Promise<{ text: string; sources: Source[] }>;
  generateJson<S extends z.ZodType>(req: AiRequest, schema: S): Promise<{ data: z.infer<S>; sources: Source[] }>;
  streamChat(req: ChatRequest): AsyncGenerator<ChatPart>;
}

export interface GeminiOptions {
  apiKey: string;
  model: string;
  fallbackModel: string;
  timeoutMs?: number;
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const BUSY_MESSAGE = 'Saathi is very busy right now. Please try again in a minute.';

function statusOf(err: unknown): number | undefined {
  return typeof err === 'object' && err !== null && 'status' in err && typeof err.status === 'number'
    ? err.status
    : undefined;
}

/** Converts a zod schema to the JSON schema Gemini expects for `response_format`. */
function toResponseFormat(schema: z.ZodType) {
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(schema, { target: 'draft-7' });
  return { type: 'text' as const, mime_type: 'application/json', schema: jsonSchema };
}

function withGrounding(input: string | AiPart[], urls?: readonly string[]): string | AiPart[] {
  if (!urls?.length) return input;
  const note = `Read these official pages and base your answer on them:\n${urls.map((u) => `- ${u}`).join('\n')}`;
  return typeof input === 'string' ? `${input}\n\n${note}` : [...input, { type: 'text', text: note }];
}

/** Lists official pages Gemini actually fetched successfully (from url_context result steps). */
function fetchedSources(steps: ReadonlyArray<{ type: string; result?: unknown }> | undefined): Source[] {
  const seen = new Map<string, Source>();
  for (const step of steps ?? []) {
    if (step.type !== 'url_context_result' || !Array.isArray(step.result)) continue;
    for (const r of step.result as Array<{ url?: string; status?: string }>) {
      if (!r.url || r.status !== 'success' || seen.has(r.url)) continue;
      seen.set(r.url, { title: new URL(r.url).hostname.replace(/^www\./, ''), url: r.url });
    }
  }
  return [...seen.values()];
}

export function createGeminiClient(options: GeminiOptions): AiClient {
  const ai = new GoogleGenAI({ apiKey: options.apiKey });
  const timeoutMs = options.timeoutMs ?? 60_000;
  const models = [...new Set([options.model, options.fallbackModel])];

  /** Runs `attempt` on the primary model, then the fallback model if it is busy or fails. */
  async function withFallback<T>(attempt: (model: string, signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
    let lastError: unknown;
    for (const model of models) {
      const timeout = AbortSignal.timeout(timeoutMs);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
      try {
        return await attempt(model, combined);
      } catch (err) {
        if (signal?.aborted) throw err;
        lastError = err;
        const status = statusOf(err);
        const retryable = err instanceof SyntaxError || err instanceof z.ZodError || (status !== undefined && RETRYABLE.has(status)) || combined.aborted;
        logger.warn({ model, status, kind: err instanceof Error ? err.name : 'unknown' }, 'gemini call failed');
        if (!retryable) break;
      }
    }
    throw new HttpError('ai_unavailable', BUSY_MESSAGE, { cause: lastError });
  }

  const config = (req: { thinking?: Thinking; maxOutputTokens?: number }) => ({
    thinking_level: req.thinking ?? 'low',
    ...(req.maxOutputTokens ? { max_output_tokens: req.maxOutputTokens } : {}),
  });

  const grounding = (urls?: readonly string[]) => (urls?.length ? { tools: [{ type: 'url_context' as const }] } : {});

  return {
    generateText(req) {
      return withFallback(async (model, signal) => {
        const r = await ai.interactions.create(
          {
            model,
            system_instruction: req.system,
            input: withGrounding(req.input, req.groundingUrls),
            generation_config: config(req),
            store: false,
            ...grounding(req.groundingUrls),
          },
          { signal },
        );
        const text = r.output_text?.trim() ?? '';
        if (!text && !req.allowEmpty) throw new SyntaxError('empty model output');
        return { text, sources: fetchedSources(r.steps) };
      }, req.signal);
    },

    generateJson(req, schema) {
      return withFallback(async (model, signal) => {
        const r = await ai.interactions.create(
          {
            model,
            system_instruction: req.system,
            input: withGrounding(req.input, req.groundingUrls),
            response_format: toResponseFormat(schema),
            generation_config: config(req),
            store: false,
            ...grounding(req.groundingUrls),
          },
          { signal },
        );
        const data = schema.parse(JSON.parse(r.output_text ?? ''));
        return { data, sources: fetchedSources(r.steps) };
      }, req.signal);
    },

    async *streamChat(req) {
      // Failover is only safe before the first byte is sent to the client.
      let started = false;
      for (const model of models) {
        try {
          const stream = await ai.interactions.create(
            {
              model,
              system_instruction: req.system,
              input: req.turns.map((t) =>
                t.role === 'user'
                  ? { type: 'user_input' as const, content: [{ type: 'text' as const, text: t.text }] }
                  : { type: 'model_output' as const, content: [{ type: 'text' as const, text: t.text }] },
              ),
              tools: [
                ...req.functions.map((f) => ({ type: 'function' as const, ...f })),
                ...(req.groundingUrls?.length ? [{ type: 'url_context' as const }] : []),
              ],
              generation_config: config({}),
              store: false,
              stream: true,
            },
            { signal: req.signal ? AbortSignal.any([req.signal, AbortSignal.timeout(timeoutMs * 2)]) : AbortSignal.timeout(timeoutMs * 2) },
          );
          const calls = new Map<number, { name: string; args: string }>();
          const fetched: Array<{ type: string; result?: unknown }> = [];
          for await (const e of stream) {
            if (e.event_type === 'step.start' && e.step.type === 'function_call') {
              calls.set(e.index, { name: e.step.name ?? '', args: '' });
            } else if (e.event_type === 'step.start' && e.step.type === 'url_context_result') {
              fetched.push(e.step);
            } else if (e.event_type === 'step.delta' && e.delta.type === 'text') {
              started = true;
              yield { type: 'text', text: e.delta.text };
            } else if (e.event_type === 'step.delta' && e.delta.type === 'arguments_delta') {
              const call = calls.get(e.index);
              if (call) call.args += e.delta.arguments ?? '';
            } else if (e.event_type === 'step.stop') {
              const call = calls.get(e.index);
              if (call) {
                started = true;
                calls.delete(e.index);
                yield { type: 'call', name: call.name, args: parseArgs(call.args) };
              }
            }
          }
          const sources = fetchedSources(fetched);
          if (sources.length) yield { type: 'sources', sources };
          return;
        } catch (err) {
          const status = statusOf(err);
          const canFailOver = !started && status !== undefined && RETRYABLE.has(status);
          logger.warn({ model, status }, 'gemini stream failed');
          if (!canFailOver || model === models.at(-1)) {
            throw new HttpError('ai_unavailable', BUSY_MESSAGE, { cause: err });
          }
        }
      }
    },
  };
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
