import type { Request, RequestHandler } from 'express';
import helmet from 'helmet';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

/** Strict CSP: same-origin scripts only; Supabase is the only third-party connect target. */
export function securityHeaders(supabaseUrl: string): RequestHandler {
  const supabaseOrigin = new URL(supabaseUrl).origin;
  const supabaseWs = supabaseOrigin.replace(/^http/, 'ws');
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'", 'blob:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", supabaseOrigin, supabaseWs],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginEmbedderPolicy: false,
  });
}

const keyByUserOrIp = (req: Request): string =>
  req.user?.id ?? ipKeyGenerator(req.ip ?? '0.0.0.0');

const limited = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'Too many requests. Please wait a minute and try again.' } },
} as const;

/** Broad per-IP limit applied to everything under /api. */
export const apiLimiter = rateLimit({ ...limited, windowMs: 60_000, limit: 120 });

/** Tighter per-user limit for routes that call Gemini (cost and abuse control). */
export const aiLimiter = rateLimit({ ...limited, windowMs: 60_000, limit: 20, keyGenerator: keyByUserOrIp });
