/**
 * Official pages the model is asked to read. Each was confirmed fetchable by Gemini's
 * url_context tool on 2026-10-17; many other government sites block automated fetches and
 * are deliberately left out. If a page cannot be fetched at request time the answer is
 * returned without that source, and the UI says so.
 */
export const SCHEME_PAGES = [
  'https://eshram.gov.in/',
  'https://www.myscheme.gov.in/',
  'https://labour.gov.in/',
  'https://www.epfo.gov.in/',
] as const;

export const ROAD_SAFETY_PAGES = ['https://morth.gov.in/'] as const;
