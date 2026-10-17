import type { z } from 'zod';
import { createApp, type Deps } from '../src/server/app.js';
import type { AiClient, ChatPart } from '../src/server/ai/client.js';
import type { EarningInput } from '../src/shared/domain.js';

export const TOKEN = 'test-token';
export const AUTH = { Authorization: `Bearer ${TOKEN}` } as const;

export interface FakeAi extends AiClient {
  calls: Array<{ kind: 'text' | 'json' | 'chat'; req: unknown }>;
}

/** Deterministic AI double: returns queued values and records every request it receives. */
export function fakeAi(handlers: {
  json?: (req: unknown, schema: z.ZodType) => unknown;
  text?: (req: unknown) => string;
  chat?: () => ChatPart[];
  fail?: Error;
} = {}): FakeAi {
  const calls: FakeAi['calls'] = [];
  return {
    calls,
    async generateText(req) {
      calls.push({ kind: 'text', req });
      if (handlers.fail) throw handlers.fail;
      return { text: handlers.text?.(req) ?? 'ok', sources: [] };
    },
    async generateJson(req, schema) {
      calls.push({ kind: 'json', req });
      if (handlers.fail) throw handlers.fail;
      const raw = handlers.json?.(req, schema);
      return { data: schema.parse(raw), sources: [{ title: 'eshram.gov.in', url: 'https://eshram.gov.in/' }] };
    },
    async *streamChat(req) {
      calls.push({ kind: 'chat', req });
      if (handlers.fail) throw handlers.fail;
      for (const p of handlers.chat?.() ?? [{ type: 'text', text: 'hello' }]) yield p;
    },
  };
}

export const sampleEarning = (over: Partial<EarningInput> = {}): EarningInput => ({
  entry_date: '2026-10-10',
  platform: 'Swiggy',
  amount_in: 1000,
  expenses: 200,
  hours: 8,
  trips: 12,
  notes: null,
  source: 'manual',
  ...over,
});

export function testApp(ai: AiClient, over: Partial<Deps> = {}) {
  return createApp({
    ai,
    supabaseUrl: 'https://example.supabase.co',
    verifyToken: async (t) => (t === TOKEN ? 'user-1' : null),
    loadEarnings: async () => [sampleEarning(), sampleEarning({ platform: 'Zomato', amount_in: 600, expenses: 100, hours: 4, entry_date: '2026-10-11' })],
    ...over,
  });
}
