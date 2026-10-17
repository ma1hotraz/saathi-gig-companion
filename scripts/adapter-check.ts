import { createGeminiClient } from '../src/server/ai/client.js';
import { earningsExtractResultSchema, schemesResultSchema, safetyResultSchema, documentAnalysisSchema, grievanceResultSchema } from '../src/shared/api.js';

const ai = createGeminiClient({ apiKey: process.env.GEMINI_API_KEY!, model: process.env.GEMINI_MODEL!, fallbackModel: process.env.GEMINI_FALLBACK_MODEL! });
const today = new Date().toISOString().slice(0, 10);

const r1 = await ai.generateJson({ system: `Extract earnings entries. Today is ${today}. Use platform names as spoken. Use null for unknown notes; use 0 for unknown numbers.`, input: 'Aaj Swiggy se 850 rupaye kamaye, 9 ghante, 14 trips. Petrol pe 200 laga.' }, earningsExtractResultSchema.omit({ transcript: true }));
console.log('earnings:', JSON.stringify(r1.data));

const r2 = await ai.generateJson({ system: 'Explain in simple Hindi for a delivery worker.', input: 'Which central social security schemes can a 30 year old gig delivery worker in Karnataka use?', groundingUrls: ['https://eshram.gov.in/'] }, schemesResultSchema);
console.log('schemes:', r2.data.schemes.length, 'first:', r2.data.schemes[0]?.name, '| sources:', r2.sources.map((s) => s.url));

const r3 = await ai.generateJson({ system: 'Plain language, short sentences.', input: 'Situation: working at night as a delivery rider in Delhi.' }, safetyResultSchema.omit({ sources: true }));
console.log('safety do_now:', r3.data.do_now.length);

const r4 = await ai.generateJson({ system: 'Analyse the document for a worker. Plain language.', input: [{ type: 'text', text: 'Analyse this document.' }, { type: 'document', data: (await import('node:fs')).readFileSync('tests/fixtures/notice.pdf').toString('base64'), mime_type: 'application/pdf' }] }, documentAnalysisSchema);
console.log('doc:', r4.data.document_type, '| deadlines:', r4.data.deadlines, '| flags:', r4.data.red_flags.length);

const r5 = await ai.generateJson({ system: 'Write a polite formal complaint letter in English plus a simple summary.', input: 'Issue: unpaid wages. Counterparty: QuickRide Logistics. Amount Rs 3250. Story: They deactivated my account and adjusted my payout against a penalty without notice.' }, grievanceResultSchema);
console.log('grievance letter chars:', r5.data.letter.length, '| where:', r5.data.where_to_file.map((w) => w.place));

let chunks = 0, calls: string[] = [];
for await (const p of ai.streamChat({ system: 'You are Saathi.', turns: [{ role: 'user', text: 'Zomato has not paid me. Help me complain.' }], functions: [{ name: 'draft_grievance', description: 'Open complaint wizard', parameters: { type: 'object', properties: { counterparty: { type: 'string' } }, required: ['counterparty'] } }] })) {
  if (p.type === 'text') chunks++; if (p.type === 'call') calls.push(`${p.name}(${JSON.stringify(p.args)})`);
}
console.log('stream text chunks:', chunks, 'calls:', calls);
