import { readFileSync } from 'node:fs';
import { createGeminiClient } from '../src/server/ai/client.js';
import { earningsExtractResultSchema } from '../src/shared/api.js';
import { earningsExtractPrompt } from '../src/server/ai/prompts/features.js';
const ai = createGeminiClient({ apiKey: process.env.GEMINI_API_KEY!, model: process.env.GEMINI_MODEL!, fallbackModel: process.env.GEMINI_FALLBACK_MODEL! });
const r = await ai.generateJson({ system: earningsExtractPrompt('en', new Date().toISOString().slice(0,10)), input: [{ type: 'text', text: 'Extract the earnings.' }, { type: 'image', data: readFileSync('tests/fixtures/payout.png').toString('base64'), mime_type: 'image/png' }] }, earningsExtractResultSchema);
console.log(JSON.stringify(r.data));
