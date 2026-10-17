import type { Request } from 'express';
import type { z } from 'zod';
import { HttpError } from '../lib/errors.js';

/** Validates untrusted input against a zod schema, throwing a 400 with the first problem. */
export function parseOrThrow<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path.length ? ` (${issue.path.join('.')})` : '';
    throw new HttpError('bad_request', `${issue?.message ?? 'Invalid request'}${where}`);
  }
  return result.data;
}

export const parseBody = <T extends z.ZodType>(schema: T, req: Request): z.infer<T> =>
  parseOrThrow(schema, req.body);
