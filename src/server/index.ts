import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createApp } from './app.js';
import { createGeminiClient } from './ai/client.js';
import { loadConfig } from './config.js';
import { createSupabaseVerifier, userScopedClient } from './middleware/auth.js';
import { earningInputSchema } from '../shared/domain.js';
import { z } from 'zod';
import { logger } from './lib/logger.js';

const config = loadConfig();

const app = createApp({
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
  // dist/server/server/index.js -> dist/web (production); src/server -> ../../dist/web (dev)
  webDir: join(fileURLToPath(new URL('.', import.meta.url)), config.NODE_ENV === 'production' ? '../../web' : '../../dist/web'),
});

app.listen(config.PORT, () => logger.info({ port: config.PORT }, 'Saathi API listening'));
