import { Router } from 'express';
import { languageSchema } from '../../shared/domain.js';
import { transcribePrompt } from '../ai/prompts/features.js';
import { audioUpload, verifyUpload } from '../middleware/upload.js';
import { bodyField, parseOrThrow } from '../middleware/validate.js';
import type { Deps } from '../app.js';

export function speechRoutes({ ai }: Deps): Router {
  const router = Router();

  router.post('/transcribe', audioUpload.single('file'), async (req, res) => {
    const language = parseOrThrow(languageSchema, bodyField(req, 'language'));
    const file = await verifyUpload(req.file, 'audio');
    const { text } = await ai.generateText({
      system: transcribePrompt(language),
      allowEmpty: true,
      input: [
        { type: 'text', text: 'Transcribe.' },
        { type: 'audio', data: file.buffer.toString('base64'), mime_type: file.mimeType },
      ],
    });
    res.json({ text });
  });
  return router;
}
