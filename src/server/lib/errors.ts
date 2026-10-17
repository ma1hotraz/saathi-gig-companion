import type { ApiError } from '../../shared/api.js';

type ErrorCode = ApiError['error']['code'];

const STATUS: Record<ErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  too_large: 413,
  unsupported_media: 415,
  rate_limited: 429,
  ai_unavailable: 502,
  internal: 500,
};

/** The single error type thrown by routes and middleware; the error handler renders it. */
export class HttpError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'HttpError';
    this.code = code;
    this.status = STATUS[code];
  }
}
