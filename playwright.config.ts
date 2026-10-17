import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests drive the production build in real Chrome against the real Supabase project
 * and the real Gemini API (no mocks). Build first: `npm run build`.
 */
const remote = process.env.BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: remote ?? 'http://localhost:8080',
    channel: 'chrome',
    ...devices['Pixel 7'],
    trace: 'retain-on-failure',
  },
  // Against a deployed URL (BASE_URL) there is nothing to start.
  webServer: remote
    ? undefined
    : {
        command: 'node --env-file=.env dist/server/server/index.js',
        url: 'http://localhost:8080/api/health',
        reuseExistingServer: true,
        env: { NODE_ENV: 'production', PORT: '8080' },
      },
});
