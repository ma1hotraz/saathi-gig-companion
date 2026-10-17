import { LRUCache } from 'lru-cache';

/** Small typed TTL cache used for expensive, user-independent AI answers and auth lookups. */
export function createCache<V extends {}>(options: { max: number; ttlMs: number }) {
  const cache = new LRUCache<string, V>({ max: options.max, ttl: options.ttlMs });
  return {
    get: (key: string): V | undefined => cache.get(key),
    set: (key: string, value: V): void => void cache.set(key, value),
    async getOrCompute(key: string, compute: () => Promise<V>): Promise<V> {
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const value = await compute();
      cache.set(key, value);
      return value;
    },
  };
}
