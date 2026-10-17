import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)) } },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'node',
    coverage: { provider: 'v8', include: ['src/server/**', 'src/shared/**'], exclude: ['src/server/index.ts'] },
  },
});
