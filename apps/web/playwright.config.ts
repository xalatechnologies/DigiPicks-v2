import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const appDir = dirname(fileURLToPath(import.meta.url));

/**
 * E2E scaffold for golden journeys (see docs/functionality-index.md).
 * Install browsers: pnpm --filter @digipicks/web run e2e:install
 * Run tests (starts Vite only — Convex-backed pages may warn in console): pnpm --filter @digipicks/web run e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'pnpm exec vite --port 5173 --strictPort',
        cwd: appDir,
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
      },
});
