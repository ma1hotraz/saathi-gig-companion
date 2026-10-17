import { Router } from 'express';
import { schemesRequestSchema, schemesResultSchema, type SchemesResult } from '../../shared/api.js';
import { schemesPrompt } from '../ai/prompts/features.js';
import { SCHEME_PAGES } from '../ai/sources.js';
import { createCache } from '../lib/cache.js';
import { parseBody } from '../middleware/validate.js';
import type { Deps } from '../app.js';

const ALLOWED_ORIGINS = new Set(SCHEME_PAGES.map((u) => new URL(u).origin));

export function schemesRoutes({ ai }: Deps): Router {
  const router = Router();
  const cache = createCache<SchemesResult>({ max: 200, ttlMs: 12 * 60 * 60_000 });

  router.post('/', async (req, res) => {
    const body = parseBody(schemesRequestSchema, req);
    const key = [body.state, body.work_type, body.age_band, body.income_band, body.language].join('|');
    const result = await cache.getOrCompute(key, async () => {
      const profile = `State: ${body.state ?? 'not given'}. Work: ${body.work_type ?? 'not given'}. Age: ${body.age_band ?? 'not given'}. Monthly income: ${body.income_band ?? 'not given'}.`;
      const { data, sources } = await ai.generateJson(
        { system: schemesPrompt(body.language), input: `Worker profile: ${profile}`, groundingUrls: SCHEME_PAGES, thinking: 'medium' },
        schemesResultSchema.omit({ sources: true }),
      );
      return {
        ...data,
        // The model may only link to pages it was given; anything else could be invented.
        schemes: data.schemes.map((s) => ({
          ...s,
          official_url: s.official_url && ALLOWED_ORIGINS.has(new URL(s.official_url).origin) ? s.official_url : null,
        })),
        sources,
      };
    });
    res.json(result);
  });
  return router;
}
