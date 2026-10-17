import { z } from 'zod';
import { earningInputSchema } from '../shared/domain.js';
import { createGeminiClient } from './ai/client.js';
import { createApp, type Deps } from './app.js';
import type { Config } from './config.js';
import { createSupabaseVerifier, userScopedClient } from './middleware/auth.js';

/** Wires the real Gemini client and Supabase access from validated config. */
export function buildDeps(config: Config, webDir?: string): Deps {
  return {
    ai: createGeminiClient({ apiKey: config.GEMINI_API_KEY, model: config.GEMINI_MODEL, fallbackModel: config.GEMINI_FALLBACK_MODEL }),
    supabaseUrl: config.SUPABASE_URL,
    verifyToken: createSupabaseVerifier(config.SUPABASE_URL, config.SUPABASE_ANON_KEY),
    async loadEarnings(user, days) {
      const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      const { data, error } = await userScopedClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, user.token)
        .from('earnings')
        .select('entry_date,platform,amount_in,expenses,hours,trips,notes,source')
        .gte('entry_date', since)
        .order('entry_date', { ascending: false })
        .limit(500);
      if (error) throw new Error('Could not read earnings');
      return z.array(earningInputSchema).parse(data);
    },
    webDir,
  };
}

export const buildApp = (config: Config, webDir?: string) => createApp(buildDeps(config, webDir));
