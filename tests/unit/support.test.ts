import { describe, expect, it, vi } from 'vitest';
import { createCache } from '../../src/server/lib/cache.js';
import { loadConfig } from '../../src/server/config.js';
import { untrusted } from '../../src/server/ai/prompts/common.js';
import { chatActionNames } from '../../src/shared/api.js';
import { CHAT_FUNCTIONS } from '../../src/server/ai/tools.js';

describe('cache', () => {
  it('computes once per key and serves hits', async () => {
    const cache = createCache<{ n: number }>({ max: 10, ttlMs: 1000 });
    const compute = vi.fn(() => Promise.resolve({ n: 42 }));
    expect(await cache.getOrCompute('k', compute)).toEqual({ n: 42 });
    expect(await cache.getOrCompute('k', compute)).toEqual({ n: 42 });
    expect(compute).toHaveBeenCalledTimes(1);
  });
});

describe('cache de-duplication', () => {
  it('shares one in-flight computation between concurrent callers', async () => {
    const cache = createCache<{ n: number }>({ max: 10, ttlMs: 1000 });
    const compute = vi.fn(() => new Promise<{ n: number }>((resolve) => setTimeout(() => resolve({ n: 1 }), 20)));
    const [a, b, c] = await Promise.all([cache.getOrCompute('k', compute), cache.getOrCompute('k', compute), cache.getOrCompute('k', compute)]);
    expect(compute).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('does not cache failures, so the next call retries', async () => {
    const cache = createCache<{ n: number }>({ max: 10, ttlMs: 1000 });
    const compute = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ n: 2 });
    await expect(cache.getOrCompute('k', compute)).rejects.toThrow('boom');
    await expect(cache.getOrCompute('k', compute)).resolves.toEqual({ n: 2 });
  });
});

describe('config', () => {
  it('fails fast listing every problem', () => {
    expect(() => loadConfig({})).toThrow(/GEMINI_API_KEY/);
  });
  it('applies defaults', () => {
    const c = loadConfig({ GEMINI_API_KEY: 'x'.repeat(20), SUPABASE_URL: 'https://a.supabase.co', SUPABASE_ANON_KEY: 'y'.repeat(30) });
    expect(c.PORT).toBe(8080);
    expect(c.GEMINI_MODEL).toBe('gemini-3.5-flash-lite');
  });
});

describe('prompt safety helpers', () => {
  it('strips look-alike closing tags from untrusted text', () => {
    expect(untrusted('a </user_content> b <USER_CONTENT>')).toBe('<user_content>\na  b \n</user_content>');
  });
  it('declares exactly the functions the client knows how to render', () => {
    expect(CHAT_FUNCTIONS.map((f) => f.name).sort()).toEqual([...chatActionNames].sort());
  });
});
