/**
 * End-to-end check of every AI route through the real Express app and the real Gemini API.
 * Only sign-in verification and the earnings loader are stubbed (they need a Supabase session).
 * Run: npx tsx --env-file=.env scripts/smoke-routes.ts
 */
import { readFileSync } from 'node:fs';
import request from 'supertest';
import { createApp } from '../src/server/app.js';
import { createGeminiClient } from '../src/server/ai/client.js';
import { loadConfig } from '../src/server/config.js';

const config = loadConfig({ ...process.env, SUPABASE_URL: process.env.SUPABASE_URL ?? 'https://x.supabase.co' });
const app = createApp({
  ai: createGeminiClient({ apiKey: config.GEMINI_API_KEY, model: config.GEMINI_MODEL, fallbackModel: config.GEMINI_FALLBACK_MODEL }),
  supabaseUrl: config.SUPABASE_URL,
  verifyToken: (t) => Promise.resolve(t === 'smoke' ? 'smoke-user' : null),
  loadEarnings: () => Promise.resolve([
    { entry_date: '2026-10-10', platform: 'Swiggy', amount_in: 1200, expenses: 250, hours: 9, trips: 16, notes: null, source: 'manual' as const },
    { entry_date: '2026-10-11', platform: 'Zomato', amount_in: 700, expenses: 120, hours: 6, trips: 9, notes: null, source: 'manual' as const },
  ]),
});
const auth = { Authorization: 'Bearer smoke' };
const fx = (n: string) => readFileSync(new URL(`../tests/fixtures/${n}`, import.meta.url));
let failed = 0;
async function check(name: string, run: () => Promise<string>) {
  const t0 = Date.now();
  try { console.log(`PASS  ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s): ${await run()}`); }
  catch (e) { failed++; console.log(`FAIL  ${name}: ${e instanceof Error ? e.message.slice(0, 400) : String(e)}`); }
}
const ok = (res: request.Response) => { if (res.status !== 200) throw new Error(`${res.status} ${JSON.stringify(res.body).slice(0, 300)}`); return res.body as Record<string, any>; };

await check('POST /api/earnings/extract-text (Hinglish)', async () => {
  const b = ok(await request(app).post('/api/earnings/extract-text').set(auth).send({ text: 'kal Zomato se 640 kamaye, 7 ghante, petrol 150', language: 'hi' }));
  return JSON.stringify(b.entries);
});
await check('POST /api/earnings/extract-file (payout screenshot)', async () => {
  const b = ok(await request(app).post('/api/earnings/extract-file').set(auth).field('language', 'en').attach('file', fx('payout.png'), 'p.png'));
  return JSON.stringify(b.entries);
});
await check('POST /api/earnings/insights (Hindi)', async () => {
  const b = ok(await request(app).post('/api/earnings/insights').set(auth).send({ language: 'hi' }));
  return `${JSON.stringify(b.stats)} | ${String(b.insights).slice(0, 120).replace(/\n/g, ' ')}`;
});
await check('POST /api/safety (Tamil, grounded on morth.gov.in)', async () => {
  const b = ok(await request(app).post('/api/safety').set(auth).send({ situation: 'accident', work_type: 'delivery', state: 'Tamil Nadu', language: 'ta' }));
  return `do_now[0]=${b.do_now[0]} | sources=${JSON.stringify(b.sources.map((s: { url: string }) => s.url))}`;
});
await check('POST /api/schemes (Kannada, grounded)', async () => {
  const b = ok(await request(app).post('/api/schemes').set(auth).send({ state: 'Karnataka', work_type: 'delivery', age_band: '26-40', income_band: '10k_20k', language: 'kn' }));
  return `${b.schemes.length} schemes: ${b.schemes.map((s: { name: string }) => s.name).join(' | ').slice(0, 160)} | links=${JSON.stringify(b.schemes.map((s: { official_url: string | null }) => s.official_url))} | sources=${b.sources.length}`;
});
await check('POST /api/documents/analyze (PDF notice)', async () => {
  const b = ok(await request(app).post('/api/documents/analyze').set(auth).field('language', 'en').attach('file', fx('notice.pdf'), 'n.pdf'));
  return `${b.document_type} | deadlines=${JSON.stringify(b.deadlines)} | complaint=${b.suggest_complaint}`;
});
await check('POST /api/documents/ask', async () => {
  const analysis = ok(await request(app).post('/api/documents/analyze').set(auth).field('language', 'en').attach('file', fx('notice.png'), 'n.png'));
  const b = ok(await request(app).post('/api/documents/ask').set(auth).send({ question: 'How many days do I have to appeal?', analysis, language: 'en' }));
  return String(b.answer).slice(0, 140);
});
await check('POST /api/grievance/draft (English letter, Hindi summary)', async () => {
  const b = ok(await request(app).post('/api/grievance/draft').set(auth).send({ issue_type: 'unfair_deactivation', counterparty: 'QuickRide Logistics', incident_date: '2026-10-14', amount: 3250, story: 'They deactivated my account without notice and kept my pending payout of 3250 rupees against a penalty.', state: 'Delhi', language: 'hi', letter_language: 'en' }));
  return `letter ${String(b.letter).length} chars, starts: ${String(b.letter).slice(0, 90).replace(/\n/g, ' ')} | where=${b.where_to_file.length}`;
});
await check('POST /api/chat (SSE stream + action card)', async () => {
  const res = await request(app).post('/api/chat').set(auth).send({ messages: [{ role: 'user', text: 'Zomato ne mera 2000 rupaye 3 hafte se nahi diya. Mujhe shikayat likhni hai.' }], language: 'hi', includeEarningsContext: true });
  if (res.status !== 200) throw new Error(String(res.status));
  const events = res.text.split('\n\n').filter(Boolean).map((l) => JSON.parse(l.replace(/^data: /, '')) as { type: string; text?: string; action?: unknown; message?: string });
  const text = events.filter((e) => e.type === 'delta').map((e) => e.text).join('');
  const action = events.find((e) => e.type === 'action');
  const err = events.find((e) => e.type === 'error');
  if (err) throw new Error(err.message);
  if (!text && !action) throw new Error('neither text nor an action was streamed');
  return `${events.filter((e) => e.type === 'delta').length} deltas | action=${JSON.stringify(action?.action)} | text=${text.slice(0, 100).replace(/\n/g, ' ')}`;
});
console.log(failed === 0 ? '\nAll route checks passed against live Gemini.' : `\n${failed} route check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
