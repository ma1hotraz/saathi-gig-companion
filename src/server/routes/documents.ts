import { Router } from 'express';
import { documentAnalysisSchema, documentAskResultSchema, documentAskSchema } from '../../shared/api.js';
import { languageSchema } from '../../shared/domain.js';
import { untrusted } from '../ai/prompts/common.js';
import { documentAskPrompt, documentPrompt } from '../ai/prompts/features.js';
import { documentUpload, verifyUpload } from '../middleware/upload.js';
import { parseBody, parseOrThrow } from '../middleware/validate.js';
import type { Deps } from '../app.js';

export function documentRoutes({ ai }: Deps): Router {
  const router = Router();

  // The file is analysed in memory and never written to disk or the database.
  router.post('/analyze', documentUpload.single('file'), async (req, res) => {
    const language = parseOrThrow(languageSchema, req.body?.language);
    const file = await verifyUpload(req.file, 'document');
    const kind = file.mimeType === 'application/pdf' ? 'document' : 'image';
    const { data } = await ai.generateJson(
      {
        system: documentPrompt(language),
        input: [
          { type: 'text', text: 'Explain this document for the worker.' },
          { type: kind, data: file.buffer.toString('base64'), mime_type: file.mimeType },
        ],
        thinking: 'medium',
      },
      documentAnalysisSchema,
    );
    res.json(data);
  });

  router.post('/ask', async (req, res) => {
    const body = parseBody(documentAskSchema, req);
    const { text } = await ai.generateText({
      system: documentAskPrompt(body.language),
      input: `Document analysis:\n${untrusted(JSON.stringify(body.analysis))}\n\nQuestion:\n${untrusted(body.question)}`,
    });
    res.json(documentAskResultSchema.parse({ answer: text }));
  });

  return router;
}

