import { pino } from 'pino';

/**
 * Structured logger. User content (messages, documents, earnings) is never logged;
 * the redact list is a second line of defence for accidental fields.
 */
export const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : (process.env.LOG_LEVEL ?? 'info'),
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.token', '*.password', '*.text', '*.story'],
    censor: '[redacted]',
  },
});
