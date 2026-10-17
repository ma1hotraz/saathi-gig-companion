import { LRUCache } from 'lru-cache';

/**
 * Small typed TTL cache for expensive, user-independent AI answers and auth lookups.
 * Concurrent requests for the same key share one in-flight computation, so a burst of identical
 * requests costs a single model call.
 */
export function createCache<V extends object>(options: { max: number; ttlMs: number }) {
  const cache = new LRUCache<string, V>({ max: options.max, ttl: options.ttlMs });
  const pending = new Map<string, Promise<V>>();
  return {
    get: (key: string): V | undefined => cache.get(key),
    set: (key: string, value: V): void => void cache.set(key, value),
    async getOrCompute(key: string, compute: () => Promise<V>): Promise<V> {
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const running = pending.get(key);
      if (running) return running;
      const promise = compute()
        .then((value) => {
          cache.set(key, value);
          return value;
        })
        .finally(() => pending.delete(key));
      pending.set(key, promise);
      return promise;
    },
  };
}
