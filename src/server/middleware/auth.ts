import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createCache } from '../lib/cache.js';
import { HttpError } from '../lib/errors.js';

export interface AuthUser {
  id: string;
  /** The caller's own access token, used to query Supabase so row-level security still applies. */
  token: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

/** Resolves a bearer token to a user id, or null if the token is invalid or expired. */
export type TokenVerifier = (token: string) => Promise<string | null>;

/** Verifies tokens with Supabase Auth (server-side check, not just JWT decoding). */
export function createSupabaseVerifier(url: string, anonKey: string): TokenVerifier {
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  // Cache by token hash for 60s so a burst of requests costs one Supabase round-trip.
  const cache = createCache<{ id: string | null }>({ max: 500, ttlMs: 60_000 });
  return async (token) => {
    const key = createHash('sha256').update(token).digest('hex');
    const { id } = await cache.getOrCompute(key, async () => {
      const { data, error } = await client.auth.getUser(token);
      return { id: error || !data.user ? null : data.user.id };
    });
    return id;
  };
}

/** Creates a Supabase client acting as the caller, so every query is filtered by RLS. */
export function userScopedClient(url: string, anonKey: string, token: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export function requireAuth(verify: TokenVerifier): RequestHandler {
  return async (req, _res, next) => {
    const header = req.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) throw new HttpError('unauthorized', 'Please sign in to continue');
    const id = await verify(token);
    if (!id) throw new HttpError('unauthorized', 'Your session has expired. Please sign in again.');
    req.user = { id, token };
    next();
  };
}
