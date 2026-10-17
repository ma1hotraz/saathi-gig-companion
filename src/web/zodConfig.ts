/**
 * Runs before zod loads (it imports nothing, and is shipped as its own first chunk). zod's JIT
 * compiler relies on `new Function`, which the app's strict CSP (no unsafe-eval) forbids; with
 * `jitless` set, zod skips that probe and uses its interpreter, which is fast enough for the small
 * payloads used here.
 */
(globalThis as { __zod_globalConfig?: { jitless: boolean } }).__zod_globalConfig = { jitless: true };
