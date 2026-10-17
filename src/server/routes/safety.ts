import { Router } from 'express';
import { safetyRequestSchema, safetyResultSchema, type SafetyResult } from '../../shared/api.js';
import { languageName } from '../../shared/domain.js';
import { situationText, safetyPrompt } from '../ai/prompts/features.js';
import { ROAD_SAFETY_PAGES } from '../ai/sources.js';
import { createCache } from '../lib/cache.js';
import { parseBody } from '../middleware/validate.js';
import type { Deps } from '../app.js';

const ROAD_SITUATIONS = new Set(['night_shift', 'accident', 'vehicle_breakdown', 'rain_flood']);

export function safetyRoutes({ ai }: Deps): Router {
  const router = Router();
  // Safety answers do not depend on the user, so identical requests share one AI call.
  const cache = createCache<SafetyResult>({ max: 200, ttlMs: 6 * 60 * 60_000 });

  router.post('/', async (req, res) => {
    const body = parseBody(safetyRequestSchema, req);
    const key = [body.situation, body.work_type, body.state, body.language].join('|');
    const result = await cache.getOrCompute(key, async () => {
      const { data, sources } = await ai.generateJson(
        {
          system: safetyPrompt(body.language),
          input: `Situation: ${situationText(body.situation)}.\nWork: ${body.work_type ?? 'not given'}. State: ${body.state ?? 'not given'}.\nAnswer in ${languageName(body.language)}.`,
          groundingUrls: ROAD_SITUATIONS.has(body.situation) ? ROAD_SAFETY_PAGES : undefined,
        },
        safetyResultSchema.omit({ sources: true }),
      );
      return { ...data, sources };
    });
    res.json(result);
  });
  return router;
}
