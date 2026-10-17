import { Router } from 'express';
import { grievanceRequestSchema, grievanceResultSchema } from '../../shared/api.js';
import { grievancePrompt } from '../ai/prompts/features.js';
import { untrusted } from '../ai/prompts/common.js';
import { parseBody } from '../middleware/validate.js';
import type { Deps } from '../app.js';

export function grievanceRoutes({ ai }: Deps): Router {
  const router = Router();

  router.post('/draft', async (req, res) => {
    const b = parseBody(grievanceRequestSchema, req);
    const facts = [
      `Issue type: ${b.issue_type}`,
      `Company or employer: ${b.counterparty}`,
      `Date of incident: ${b.incident_date ?? 'not given'}`,
      `Amount involved: ${b.amount === null ? 'not given' : `₹${b.amount}`}`,
      `State: ${b.state ?? 'not given'}`,
      `Worker's account of what happened:\n${untrusted(b.story)}`,
    ].join('\n');
    const { data } = await ai.generateJson(
      { system: grievancePrompt(b.language, b.letter_language), input: facts, thinking: 'medium' },
      grievanceResultSchema,
    );
    res.json(data);
  });
  return router;
}
