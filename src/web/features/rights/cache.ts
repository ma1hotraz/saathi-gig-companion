import { schemesResultSchema, type SchemesResult } from '@shared/api';
import type { Profile } from '@shared/domain';

/** Session cache key: one entry per profile and language. */
export function schemesCacheKey(p: Profile, language: string): string {
  return `saathi.schemes.${[p.state, p.work_type, p.age_band, p.income_band, language].join('|')}`;
}

/** Reads a previously fetched, still valid result for this key, or null. */
export function readSchemesCache(key: string): SchemesResult | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = schemesResultSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Stores a result for this key; storage failures are ignored. */
export function writeSchemesCache(key: string, result: SchemesResult): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(result));
  } catch {
    /* storage unavailable: the page still works without the cache */
  }
}
