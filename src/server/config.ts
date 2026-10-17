import { z } from 'zod';

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(10, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),
  GEMINI_FALLBACK_MODEL: z.string().default('gemini-3.1-flash-lite'),
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Config = z.infer<typeof envSchema>;

/** Parses and validates environment variables; throws a readable error listing every problem. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${problems}`);
  }
  return parsed.data;
}
