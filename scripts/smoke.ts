/**
 * Live capability check against the real Gemini API (no mocks).
 * Run: npm run smoke:live   (requires GEMINI_API_KEY in .env)
 * Each check prints PASS/FAIL so shape changes in the API are caught before the app breaks.
 */
import { readFileSync } from 'node:fs';
import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';
const FALLBACK = process.env.GEMINI_FALLBACK_MODEL ?? 'gemini-3.1-flash-lite';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const b64 = (path: string) => readFileSync(new URL(`../tests/fixtures/${path}`, import.meta.url)).toString('base64');

const json = (schema: object) => ({ type: 'text' as const, mime_type: 'application/json', schema });
const low = { thinking_level: 'low' as const };

let failures = 0;
async function check(name: string, run: () => Promise<string>): Promise<void> {
  try {
    console.log(`PASS  ${name}: ${await run()}`);
  } catch (err) {
    failures++;
    console.log(`FAIL  ${name}: ${err instanceof Error ? err.message.slice(0, 300) : String(err)}`);
  }
}
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

await check('text (flash)', async () => {
  const r = await ai.interactions.create({ model: MODEL, input: 'Reply with the single word: ok', generation_config: low });
  assert(r.output_text?.trim().length, 'empty output_text');
  return r.output_text.trim().slice(0, 40);
});

await check('text (flash-lite, fast model)', async () => {
  const r = await ai.interactions.create({ model: FALLBACK, input: 'Reply with the single word: ok', generation_config: low });
  assert(r.output_text?.trim().length, 'empty output_text');
  return r.output_text.trim().slice(0, 40);
});

await check('structured JSON output', async () => {
  const schema = {
    type: 'object',
    properties: { platform: { type: 'string' }, amount: { type: 'number' } },
    required: ['platform', 'amount'],
  };
  const r = await ai.interactions.create({
    model: FALLBACK,
    input: 'Swiggy se 850 rupaye kamaye aaj',
    system_instruction: 'Extract the earning. Return JSON only.',
    response_format: json(schema),
    generation_config: low,
  });
  const parsed = JSON.parse(r.output_text ?? '');
  assert(typeof parsed.amount === 'number', `bad shape: ${r.output_text}`);
  return r.output_text ?? '';
});

await check('streaming deltas', async () => {
  const stream = await ai.interactions.create({
    model: MODEL,
    input: 'Count from 1 to 5 in words.',
    stream: true,
    generation_config: low,
  });
  let text = '';
  let deltas = 0;
  for await (const e of stream) {
    if (e.event_type === 'step.delta' && e.delta.type === 'text') {
      text += e.delta.text;
      deltas++;
    }
  }
  assert(text.length > 0, 'no text deltas received');
  return `${deltas} deltas, "${text.replace(/\s+/g, ' ').slice(0, 40)}"`;
});

await check('stateless multi-turn via steps array', async () => {
  const r = await ai.interactions.create({
    model: FALLBACK,
    generation_config: low,
    input: [
      { type: 'user_input', content: [{ type: 'text', text: 'My name is Ravi.' }] },
      { type: 'model_output', content: [{ type: 'text', text: 'Nice to meet you, Ravi.' }] },
      { type: 'user_input', content: [{ type: 'text', text: 'What is my name?' }] },
    ],
    store: false,
  });
  assert(/ravi/i.test(r.output_text ?? ''), `model forgot the name: ${r.output_text}`);
  return r.output_text?.slice(0, 50) ?? '';
});

await check('url_context grounding on an official page (+ fetched URLs in steps)', async () => {
  const r = await ai.interactions.create({
    model: MODEL,
    input: 'Using https://eshram.gov.in/ , who can register on e-Shram? One sentence.',
    tools: [{ type: 'url_context' }],
    generation_config: low,
  });
  const types = (r.steps ?? []).map((s) => s.type);
  assert(types.includes('url_context_result'), `no url_context_result step; steps: ${types.join(',')}`);
  assert(r.output_text?.trim().length, 'empty output_text');
  return r.output_text.slice(0, 100);
});

await check('url_context combined with response_format (one-pass grounded JSON)', async () => {
  const schema = {
    type: 'object',
    properties: { scheme: { type: 'string' }, who_can_join: { type: 'string' } },
    required: ['scheme', 'who_can_join'],
  };
  const r = await ai.interactions.create({
    model: MODEL,
    input: 'Using https://eshram.gov.in/ summarise who can register.',
    tools: [{ type: 'url_context' }],
    response_format: json(schema),
    generation_config: low,
  });
  const p = JSON.parse(r.output_text ?? '');
  assert(p.who_can_join, `bad shape: ${r.output_text}`);
  return (r.output_text ?? '').replace(/\s+/g, ' ').slice(0, 100);
});

await check('image input -> structured extraction (payout screenshot)', async () => {
  const schema = {
    type: 'object',
    properties: { platform: { type: 'string' }, net_payout: { type: 'number' }, trips: { type: 'number' } },
    required: ['platform', 'net_payout', 'trips'],
  };
  const r = await ai.interactions.create({
    model: FALLBACK,
    input: [
      { type: 'text', text: 'Extract the payout details from this screenshot.' },
      { type: 'image', data: b64('payout.png'), mime_type: 'image/png' },
    ],
    response_format: json(schema),
    generation_config: low,
  });
  const p = JSON.parse(r.output_text ?? '');
  assert(p.net_payout === 6090, `expected net_payout 6090, got ${r.output_text}`);
  return r.output_text ?? '';
});

await check('PDF document input (deactivation notice)', async () => {
  const r = await ai.interactions.create({
    model: MODEL,
    input: [
      { type: 'text', text: 'What is the appeal deadline in this notice? One sentence.' },
      { type: 'document', data: b64('notice.pdf'), mime_type: 'application/pdf' },
    ],
    generation_config: low,
  });
  assert(/3 days|three days/i.test(r.output_text ?? ''), `did not find 3 days: ${r.output_text}`);
  return r.output_text?.slice(0, 100) ?? '';
});

await check('function calling round-trip', async () => {
  const tools = [
    {
      type: 'function' as const,
      name: 'draft_grievance',
      description: 'Open the grievance letter wizard when the user wants to complain about a platform.',
      parameters: {
        type: 'object',
        properties: { counterparty: { type: 'string' }, issue: { type: 'string' } },
        required: ['counterparty'],
      },
    },
  ];
  const first = await ai.interactions.create({
    model: MODEL,
    input: 'Zomato has not paid me Rs 2000 for 3 weeks. Please help me write a complaint.',
    tools,
    generation_config: low,
  });
  const call = first.steps?.find((s) => s.type === 'function_call');
  assert(call && call.type === 'function_call', `no function_call step; got ${first.steps?.map((s) => s.type).join(',')}`);
  const second = await ai.interactions.create({
    model: MODEL,
    previous_interaction_id: first.id,
    tools,
    input: [{ type: 'function_result', call_id: call.id, name: call.name, result: 'Opened the complaint form.' }],
    generation_config: low,
  });
  assert(second.output_text?.trim().length, 'no final text after function_result');
  return `call=${call.name}(${JSON.stringify(call.arguments)}) -> "${second.output_text.slice(0, 50)}"`;
});

console.log(failures === 0 ? '\nAll live checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
