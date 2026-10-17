import { Router, type Response } from 'express';
import { chatActionSchema, chatRequestSchema, type ChatStreamEvent } from '../../shared/api.js';
import { summarizeEarnings } from '../../shared/earnings.js';
import { chatPrompt } from '../ai/prompts/features.js';
import { untrusted } from '../ai/prompts/common.js';
import { SCHEME_PAGES } from '../ai/sources.js';
import { CHAT_FUNCTIONS } from '../ai/tools.js';
import { logger } from '../lib/logger.js';
import { parseBody } from '../middleware/validate.js';
import { userOf } from '../middleware/auth.js';
import type { Deps } from '../app.js';

function send(res: Response, event: ChatStreamEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

/** Keeps only string/number arguments so a tool call can never smuggle in objects. */
function cleanArgs(args: Record<string, unknown>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(args)) {
    if (typeof v === 'string') out[k] = v.slice(0, 200);
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

export function chatRoutes({ ai, loadEarnings }: Deps): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    const body = parseBody(chatRequestSchema, req);

    let earningsContext: string | null = null;
    if (body.includeEarningsContext) {
      const entries = await loadEarnings(userOf(req), 30);
      if (entries.length > 0) {
        const s = summarizeEarnings(entries);
        earningsContext = JSON.stringify({ net: s.net, totalIn: s.totalIn, totalExpenses: s.totalExpenses, hours: s.hours, netPerHour: s.netPerHour, byPlatform: s.byPlatform });
      }
    }

    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    const abort = new AbortController();
    res.on('close', () => abort.abort());

    try {
      const stream = ai.streamChat({
        system: chatPrompt(body.language, earningsContext),
        // Every user turn is fenced as data; model turns are our own earlier output.
        turns: body.messages.map((m) => ({ role: m.role, text: m.role === 'user' ? untrusted(m.text) : m.text })),
        functions: CHAT_FUNCTIONS,
        groundingUrls: SCHEME_PAGES.slice(0, 2),
        signal: abort.signal,
      });
      for await (const part of stream) {
        if (part.type === 'text') send(res, { type: 'delta', text: part.text });
        else if (part.type === 'sources') send(res, { type: 'sources', sources: part.sources });
        else {
          const action = chatActionSchema.safeParse({ name: part.name, args: cleanArgs(part.args) });
          if (action.success) send(res, { type: 'action', action: action.data });
        }
      }
      send(res, { type: 'done' });
    } catch (err) {
      if (!abort.signal.aborted) {
        logger.error({ err }, 'chat stream failed');
        send(res, { type: 'error', message: 'Saathi is very busy right now. Please try again in a minute.' });
      }
    } finally {
      res.end();
    }
  });

  return router;
}
