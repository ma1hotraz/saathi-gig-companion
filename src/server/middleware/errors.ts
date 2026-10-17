import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { HttpError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'bad_request', message: 'Not found' } });
};

/** Renders every failure as the shared ApiError shape and never leaks internals. */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    res.status(tooLarge ? 413 : 400).json({
      error: { code: tooLarge ? 'too_large' : 'bad_request', message: tooLarge ? 'File is too large' : 'Invalid upload' },
    });
    return;
  }
  if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'too_large', message: 'Request is too large' } });
    return;
  }
  if (err instanceof SyntaxError) {
    res.status(400).json({ error: { code: 'bad_request', message: 'Malformed JSON' } });
    return;
  }
  logger.error({ err, path: req.path }, 'unhandled error');
  res.status(500).json({ error: { code: 'internal', message: 'Something went wrong. Please try again.' } });
};
