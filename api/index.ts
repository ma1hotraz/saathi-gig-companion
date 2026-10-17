import { buildApp } from '../src/server/bootstrap.js';
import { loadConfig } from '../src/server/config.js';

/** Vercel serverless entry: the same Express app, without a listener. Static files come from the CDN. */
export default buildApp(loadConfig());
