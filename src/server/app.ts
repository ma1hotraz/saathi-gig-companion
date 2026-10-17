import { existsSync } from 'node:fs';
import { join } from 'node:path';
import compression from 'compression';
import express, { type Express } from 'express';
import type { AiClient } from './ai/client.js';
import type { EarningInput } from '../shared/domain.js';
import { requireAuth, type AuthUser, type TokenVerifier } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { aiLimiter, apiLimiter, securityHeaders } from './middleware/security.js';
import { chatRoutes } from './routes/chat.js';
import { documentRoutes } from './routes/documents.js';
import { earningsRoutes } from './routes/earnings.js';
import { grievanceRoutes } from './routes/grievance.js';
import { healthRoutes } from './routes/health.js';
import { safetyRoutes } from './routes/safety.js';
import { schemesRoutes } from './routes/schemes.js';
import { speechRoutes } from './routes/speech.js';

/** Everything the app needs from the outside world; tests substitute fakes. */
export interface Deps {
  ai: AiClient;
  supabaseUrl: string;
  verifyToken: TokenVerifier;
  /** Loads the caller's own earnings for the last `days` days (row-level security applies). */
  loadEarnings: (user: AuthUser, days: number) => Promise<EarningInput[]>;
  /** Directory of the built web app to serve, if present. */
  webDir?: string;
}

export function createApp(deps: Deps): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Cloud Run terminates TLS in front of the container
  app.use(securityHeaders(deps.supabaseUrl));
  // Never buffer server-sent events.
  app.use(compression({ filter: (req, res) => !String(res.getHeader('Content-Type')).includes('text/event-stream') && compression.filter(req, res) }));
  app.use(express.json({ limit: '100kb' }));

  const api = express.Router();
  api.use(apiLimiter);
  api.use(healthRoutes());
  api.use(requireAuth(deps.verifyToken));
  api.use(aiLimiter);
  api.use('/chat', chatRoutes(deps));
  api.use('/earnings', earningsRoutes(deps));
  api.use('/safety', safetyRoutes(deps));
  api.use('/schemes', schemesRoutes(deps));
  api.use('/documents', documentRoutes(deps));
  api.use('/grievance', grievanceRoutes(deps));
  api.use('/speech', speechRoutes(deps));
  api.use(notFound);
  app.use('/api', api);

  if (deps.webDir && existsSync(join(deps.webDir, 'index.html'))) {
    app.use('/assets', express.static(join(deps.webDir, 'assets'), { immutable: true, maxAge: '1y' }));
    app.use(express.static(deps.webDir, { maxAge: '5m' }));
    app.get('/{*splat}', (_req, res) => res.sendFile(join(deps.webDir!, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
