import type { z } from 'zod';
import {
  apiErrorSchema,
  documentAnalysisSchema,
  documentAskResultSchema,
  earningsExtractResultSchema,
  grievanceResultSchema,
  insightsResultSchema,
  safetyResultSchema,
  schemesResultSchema,
  transcribeResultSchema,
  type ChatStreamEvent,
} from '@shared/api';
import type { LanguageCode } from '@shared/domain';
import { supabase } from './supabase';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function toError(res: Response): Promise<ApiRequestError> {
  const parsed = apiErrorSchema.safeParse(await res.json().catch(() => null));
  return parsed.success
    ? new ApiRequestError(parsed.data.error.message, parsed.data.error.code, res.status)
    : new ApiRequestError('Something went wrong. Please try again.', 'internal', res.status);
}

async function request<T extends z.ZodType>(path: string, init: RequestInit, schema: T): Promise<z.infer<T>> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { ...(await authHeaders()), ...init.headers } });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiRequestError('No internet connection. Please check your network and try again.', 'network', 0);
  }
  if (!res.ok) throw await toError(res);
  // Parsing against the shared schema catches any client/server contract drift immediately.
  return schema.parse(await res.json());
}

const postJson = <T extends z.ZodType>(path: string, body: unknown, schema: T, signal?: AbortSignal) =>
  request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal }, schema);

const postFile = <T extends z.ZodType>(path: string, file: Blob, filename: string, language: LanguageCode, schema: T, signal?: AbortSignal) => {
  const form = new FormData();
  form.append('language', language);
  form.append('file', file, filename);
  return request(path, { method: 'POST', body: form, signal }, schema);
};

type Body<S extends z.ZodType> = z.input<S>;

export const api = {
  safety: (body: Body<typeof import('@shared/api').safetyRequestSchema>, signal?: AbortSignal) =>
    postJson('/api/safety', body, safetyResultSchema, signal),
  schemes: (body: Body<typeof import('@shared/api').schemesRequestSchema>, signal?: AbortSignal) =>
    postJson('/api/schemes', body, schemesResultSchema, signal),
  draftGrievance: (body: Body<typeof import('@shared/api').grievanceRequestSchema>, signal?: AbortSignal) =>
    postJson('/api/grievance/draft', body, grievanceResultSchema, signal),
  analyzeDocument: (file: Blob, filename: string, language: LanguageCode, signal?: AbortSignal) =>
    postFile('/api/documents/analyze', file, filename, language, documentAnalysisSchema, signal),
  askDocument: (body: Body<typeof import('@shared/api').documentAskSchema>, signal?: AbortSignal) =>
    postJson('/api/documents/ask', body, documentAskResultSchema, signal),
  extractEarningsText: (text: string, language: LanguageCode, signal?: AbortSignal) =>
    postJson('/api/earnings/extract-text', { text, language }, earningsExtractResultSchema, signal),
  /** A voice note or a payout screenshot; the server tells them apart by content. */
  extractEarningsFile: (file: Blob, filename: string, language: LanguageCode, signal?: AbortSignal) =>
    postFile('/api/earnings/extract-file', file, filename, language, earningsExtractResultSchema, signal),
  insights: (language: LanguageCode, signal?: AbortSignal) =>
    postJson('/api/earnings/insights', { language }, insightsResultSchema, signal),
  transcribe: (audio: Blob, filename: string, language: LanguageCode, signal?: AbortSignal) =>
    postFile('/api/speech/transcribe', audio, filename, language, transcribeResultSchema, signal),
};

/**
 * Streams a chat reply. Calls `onEvent` for each server-sent event and resolves when the
 * stream ends. Throws ApiRequestError for HTTP-level failures (auth, validation, limits).
 */
export async function streamChat(
  body: Body<typeof import('@shared/api').chatRequestSchema>,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiRequestError('No internet connection. Please check your network and try again.', 'network', 0);
  }
  if (!res.ok || !res.body) throw await toError(res);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let end: number;
    while ((end = buffer.indexOf('\n\n')) >= 0) {
      const line = buffer.slice(0, end).replace(/^data: /, '');
      buffer = buffer.slice(end + 2);
      if (line) onEvent(JSON.parse(line) as ChatStreamEvent);
    }
  }
}

