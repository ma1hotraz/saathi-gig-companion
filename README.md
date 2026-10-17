# Saathi (साथी): a GenAI companion for gig and informal workers

Built for PromptWars (Google for Developers × H2S). Saathi helps delivery partners, drivers and daily-wage workers in India with **earnings tracking, safety, rights and welfare schemes, document help, and complaint drafting**, in their own language and in simple words. Gemini does the real work in every feature; there is no mock data and no canned output.

## What it does (and where)

| Challenge requirement | Feature | Real Gemini use | Code |
|---|---|---|---|
| Multilingual guidance | AI answers in 11 Indian languages; interface in English, Hindi, Tamil; voice in (Gemini transcription) and read-aloud | Output language and simple-language rules in every prompt; audio input | `src/server/ai/prompts/`, `src/web/i18n/`, `src/web/components/VoiceInput.tsx` |
| Earnings tracking | Log by form, by speaking ("Swiggy se 850 kamaye, petrol 200") or from a payout screenshot; dashboard; AI explanation of the worker's own numbers | Structured extraction from text, audio and images; insight generation over server-computed totals | `src/server/routes/earnings.ts`, `src/web/features/earnings/` |
| Safety practices | Safety coach for 8 real situations, emergency numbers, share-my-location | Schema-constrained guidance, grounded on an official road-safety page where relevant | `src/server/routes/safety.ts`, `src/web/features/safety/` |
| Rights and welfare scheme awareness | Scheme finder from the worker's profile with benefit, eligibility, documents, how to apply | Grounded on official pages (e-Shram, myScheme, Labour Ministry, EPFO) via Gemini URL context; only links to those pages are kept | `src/server/routes/schemes.ts`, `src/web/features/rights/` |
| Document help | Photo or PDF of a notice, contract or payslip is explained: summary, deadlines, money, red flags, next steps; follow-up questions | Multimodal (image/PDF) structured analysis; file kept in memory only | `src/server/routes/documents.ts`, `src/web/features/documents/` |
| Grievance or dispute drafting | Guided form (or voice) produces a formal letter, plain summary, where to file and an evidence checklist; edit, copy, print/PDF, WhatsApp, save | Structured drafting in English or the worker's language | `src/server/routes/grievance.ts`, `src/web/features/grievance/` |
| Connected workflows | "Ask Saathi" chat streams answers and opens the right screen, prefilled, through function calling; a document analysis hands over to the complaint writer; earnings insights link to complaints | Streaming + function calling | `src/server/routes/chat.ts`, `src/web/features/chat/` |

## Try it (for evaluators)

1. Open the app. Either tap **Continue as guest** (no credentials needed), or sign in with the shared test account **`judge.saathi@example.com`** / **`Saathi-Judge-2026`** (a throwaway account that holds no real data). Pick your language and fill the short profile.
2. Walk through Earnings → Ask → Papers (upload `tests/fixtures/notice.pdf` or any photo of a paper) → Complaint → Rights → Safety. Every result comes from a live Gemini call.
3. Free-tier note: the project runs on a free Gemini key, so under heavy use a request can return "Saathi is very busy right now". It retries once on a second model first; trying again after a minute works.

Test inputs in `tests/fixtures/` (a sample payout screenshot and a sample deactivation notice) were created for testing only.

## Run locally

```bash
cp .env.example .env        # add GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY (and the two VITE_ copies)
npm install
# Supabase: run supabase/migrations/0001_init.sql in the SQL editor; enable anonymous sign-ins;
# for email sign-up without confirmation, turn off "Confirm email".
npm run dev:api   # API on :8080
npm run dev:web   # web on :5173 (proxies /api)
```

Production: `npm run build && node --env-file=.env dist/server/server/index.js` (one process serves the API and the built app).

## Quality gates

```bash
npm run lint && npm run typecheck && npm test      # 35 unit and API tests, strict TS, type-aware ESLint + jsx-a11y
npm run test:coverage
npm run smoke:live                                 # every Gemini capability, real API
npx tsx --env-file=.env scripts/smoke-adapter.ts   # our adapter with the real schemas
npx tsx --env-file=.env scripts/smoke-routes.ts    # every AI route end to end, real Gemini
npx tsx --env-file=.env scripts/verify-rls.ts     # proves one user cannot read, change or forge another user's rows
npm run build && npm run test:e2e                  # real Chrome, live Supabase + Gemini: full journey + axe WCAG 2.2 AA scans (12 tests)
```

## Architecture

```
src/shared   zod schemas shared by browser and server (single source of truth)
src/server   Express 5: helmet CSP, rate limits, Supabase token verification, zod validation,
             upload checks, AiClient interface + Gemini adapter (timeouts, model fallback), routes
src/web      React 19 + Vite + Tailwind v4, lazy routes, self-hosted fonts, i18n, Supabase client
supabase     migration with row-level security on every table
```

- Browser → Supabase for sign-in and the worker's own rows (protected by RLS); browser → Express for anything that needs Gemini. **The Gemini key never leaves the server.**
- The AI client is an interface injected into the app, so tests run the real app with a deterministic fake and the smoke scripts run it with real Gemini.
- Details: [docs/SECURITY.md](docs/SECURITY.md), [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md), [docs/DESIGN.md](docs/DESIGN.md).

## Efficiency

Streaming chat; a cheap model (`gemini-3.5-flash-lite`) for every call with a second cheap model as fallback; low thinking budget except for letters, documents and schemes; server-side caching for scheme and safety answers; totals computed on the server so only small summaries reach the model; images downscaled to 1600px before upload; per-route code splitting; compression and long-lived hashed assets.

## Deploy (Google Cloud Run)

The Docker image is tested locally (healthy, non-root, no secrets in the image). The browser-side Supabase settings are public and are baked in at build time; the Gemini key is supplied only at runtime.

```bash
docker build -t REGION-docker.pkg.dev/PROJECT/saathi/app \
  --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=... .
docker push REGION-docker.pkg.dev/PROJECT/saathi/app
gcloud run deploy saathi --image REGION-docker.pkg.dev/PROJECT/saathi/app --region asia-south1 \
  --allow-unauthenticated --set-env-vars SUPABASE_URL=...,SUPABASE_ANON_KEY=...,GEMINI_API_KEY=...
```
Use Secret Manager for `GEMINI_API_KEY` in any non-demo deployment. (The Cloud Run step itself has not been run from this machine because `gcloud` is not installed here.)

## Honest limits

- Interface strings exist for English, Hindi and Tamil; other languages get AI answers in their language with an English interface.
- Many government sites block automated fetching; only pages confirmed fetchable are used for grounding. If none can be read, the answer says it is general guidance.
- Emergency numbers (112, 102, 1930, 181) come from the India.gov.in helpline directory; ambulance numbers differ by state and the app says so.
- This is information, not legal advice.
