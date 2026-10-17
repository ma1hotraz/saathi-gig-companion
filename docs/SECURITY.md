# Security

| Area | What Saathi does | Where |
|---|---|---|
| Secrets | The Gemini key exists only in server environment variables. The browser gets only the public Supabase URL and publishable key (safe by design; row-level security protects data). `.env` is gitignored and excluded from the Docker image. | `src/server/config.ts`, `.gitignore`, `Dockerfile` |
| Authentication | Every AI route requires a Supabase access token that the server verifies with Supabase Auth (not just decoded). Verification results are cached for 60 s by token hash. | `src/server/middleware/auth.ts` |
| Authorisation | Postgres row-level security on `profiles`, `earnings` and `grievances`: every policy limits rows to `auth.uid()`. The server reads a user's rows with that user's own token, so RLS still applies. | `supabase/migrations/0001_init.sql`, `src/server/index.ts` |
| Input validation | Every request body is validated with zod (types, ranges, lengths, enums) before use. Shared schemas are the single source of truth for client and server. | `src/shared/api.ts`, `src/server/middleware/validate.ts` |
| Uploads | 4 MB (documents) / 2 MB (audio) limits, kept in memory only, never written to disk or the database. The type is decided from the file's magic bytes, not the client's Content-Type, against a short allow-list. | `src/server/middleware/upload.ts` |
| Prompt injection | System prompts never contain user text. User text and document-derived text are wrapped in `<user_content>` tags (look-alike tags stripped) and the model is told to treat it as data. Chat "tool calls" only describe an intent; the server never acts on them, and the client only renders links to known screens. Model output is validated against zod schemas and rendered as text/markdown, never as HTML. | `src/server/ai/prompts/common.ts`, `src/server/routes/chat.ts` |
| Hallucinated links | Scheme links are kept only if their origin is one of the official pages the model was asked to read; otherwise they are removed. Sources shown to the user are the pages Gemini actually fetched successfully. | `src/server/routes/schemes.ts`, `src/server/ai/client.ts` |
| Personal data | Prompts instruct the model never to repeat full Aadhaar, PAN, bank, phone or UPI numbers. Logs never contain user content (pino redaction as a second layer). Users can delete all their data from Settings. | `src/server/ai/prompts/common.ts`, `src/server/lib/logger.ts` |
| Transport & headers | helmet with a strict CSP (same-origin scripts, `object-src 'none'`, `frame-ancestors 'none'`, connect-src limited to self and Supabase), HSTS, no-referrer, `x-powered-by` removed. | `src/server/middleware/security.ts` |
| Abuse & cost | 120 req/min per IP on the API; 20 req/min per user on AI routes; JSON bodies limited to 100 kB; AI calls have timeouts and one fallback model. | `src/server/middleware/security.ts`, `src/server/ai/client.ts` |
| Errors | One error type; clients get a friendly message and a stable code; stack traces and upstream errors are logged server-side only. | `src/server/middleware/errors.ts` |
| Supply chain | Dependencies pinned to exact versions published at least two weeks before use; `npm audit` reports 0 vulnerabilities; CI fails on high severity. | `package.json`, `.github/workflows/ci.yml` |
| Container | Multi-stage build, production dependencies only, runs as the non-root `node` user, health check. | `Dockerfile` |

Known limits: guest (anonymous) accounts are real Supabase users and share the same protections, but a lost guest session cannot be recovered; Settings offers converting a guest to an email account.
