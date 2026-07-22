import { defineConfig, devices } from "@playwright/test";

/**
 * Service worker / offline e2e suite (e2e/offline.spec.ts).
 *
 * Separate config because the service worker is intentionally disabled in
 * development — this suite builds and serves a PRODUCTION bundle on its own
 * port so it can coexist with a running dev server. Run with:
 *
 *   pnpm run test:e2e:offline
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /offline\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3200",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm run build && pnpm exec next start -p 3200",
    url: "http://localhost:3200",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
