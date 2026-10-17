import { Router } from 'express';
import {
  earningsExtractResultSchema,
  earningsExtractTextSchema,
  insightsRequestSchema,
  type EarningsExtractResult,
} from '../../shared/api.js';
import { languageSchema, type EarningInput } from '../../shared/domain.js';
import { summarizeEarnings } from '../../shared/earnings.js';
import type { AiPart } from '../ai/client.js';
import { earningsExtractPrompt, insightsPrompt } from '../ai/prompts/features.js';
import { untrusted } from '../ai/prompts/common.js';
import { HttpError } from '../lib/errors.js';
import { documentUpload, verifyUpload } from '../middleware/upload.js';
import { bodyField, parseBody, parseOrThrow } from '../middleware/validate.js';
import { userOf } from '../middleware/auth.js';
import type { Deps } from '../app.js';

const today = (): string => new Date().toISOString().slice(0, 10);

/** The model proposes entries; the server fixes provenance and rejects impossible dates. */
function sanitize(result: EarningsExtractResult, source: EarningInput['source']): EarningsExtractResult {
  const limit = today();
  return {
    transcript: result.transcript?.trim() || null,
    entries: result.entries
      .filter((e) => e.amount_in > 0 || e.expenses > 0)
      .map((e) => ({ ...e, source, entry_date: e.entry_date > limit ? limit : e.entry_date })),
  };
}

export function earningsRoutes({ ai, loadEarnings }: Deps): Router {
  const router = Router();

  router.post('/extract-text', async (req, res) => {
    const body = parseBody(earningsExtractTextSchema, req);
    const { data } = await ai.generateJson(
      { system: earningsExtractPrompt(body.language, today()), input: untrusted(body.text) },
      earningsExtractResultSchema,
    );
    res.json(sanitize(data, 'manual'));
  });

  // Voice note or payout screenshot; the kind is decided from the file's real content.
  router.post('/extract-file', documentUpload.single('file'), async (req, res) => {
    const language = parseOrThrow(languageSchema, bodyField(req, 'language'));
    let file;
    let part: AiPart;
    let source: EarningInput['source'];
    try {
      file = await verifyUpload(req.file, 'image');
      part = { type: 'image', data: file.buffer.toString('base64'), mime_type: file.mimeType };
      source = 'screenshot';
    } catch (err) {
      if (!(err instanceof HttpError) || err.code !== 'unsupported_media') throw err;
      file = await verifyUpload(req.file, 'audio');
      part = { type: 'audio', data: file.buffer.toString('base64'), mime_type: file.mimeType };
      source = 'voice';
    }
    const { data } = await ai.generateJson(
      { system: earningsExtractPrompt(language, today()), input: [{ type: 'text', text: 'Extract the earnings.' }, part] },
      earningsExtractResultSchema,
    );
    res.json(sanitize(data, source));
  });

  router.post('/insights', async (req, res) => {
    const { language } = parseBody(insightsRequestSchema, req);
    const entries = await loadEarnings(userOf(req), 30);
    if (entries.length === 0) {
      throw new HttpError('bad_request', 'Add some earnings first, then ask for insights.');
    }
    const summary = summarizeEarnings(entries);
    const stats = {
      days: summary.days,
      totalIn: summary.totalIn,
      totalExpenses: summary.totalExpenses,
      net: summary.net,
      hours: summary.hours,
      netPerHour: summary.netPerHour,
    };
    const { text } = await ai.generateText({
      system: insightsPrompt(language),
      input: JSON.stringify({ ...stats, byPlatform: summary.byPlatform }),
    });
    res.json({ insights: text, stats });
  });

  return router;
}

