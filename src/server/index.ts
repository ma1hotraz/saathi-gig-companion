import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './bootstrap.js';
import { loadConfig } from './config.js';
import { logger } from './lib/logger.js';

const config = loadConfig();
// dist/server/server/index.js -> dist/web (production); src/server -> ../../dist/web (dev)
const webDir = join(fileURLToPath(new URL('.', import.meta.url)), config.NODE_ENV === 'production' ? '../../web' : '../../dist/web');

buildApp(config, webDir).listen(config.PORT, () => logger.info({ port: config.PORT }, 'Saathi API listening'));
