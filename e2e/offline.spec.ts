import { test, expect, type Page } from "@playwright/test";
import { APP_SHELL_ROUTES } from "../src/lib/app-shell-routes";

/**
 * Service worker / offline capabilities. Runs ONLY via
 * `pnpm run test:e2e:offline` (playwright.offline.config.ts), which builds and
 * serves a production bundle — the service worker is intentionally disabled in
 * dev, so these tests are excluded from the dev-server e2e suite.
 *
 * Each test gets a fresh browser context (no prior SW, caches, or IndexedDB),
 * so "first visit" semantics hold per test.
 */

/**
 * A page is controlled once the worker has activated, which in turn means
 * install completed — i.e. the whole app-shell precache is written.
 */
async function waitForServiceWorker(page: Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker.controller != null, undefined, {
    timeout: 30_000,
  });
}

test.describe("service worker installation", () => {
  test("activates, takes control, and precaches the app shell on first visit", async ({
    page,
  }) => {
    await page.goto("/app/training");
    await waitForServiceWorker(page);

    const state = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      const precacheName = (await caches.keys()).find((k) => k.includes("precache"));
      const precached = precacheName
        ? (await (await caches.open(precacheName)).keys()).map((r) => r.url)
        : [];
      return {
        active: registration?.active?.state,
        scriptURL: registration?.active?.scriptURL,
        navigationPreloadEnabled:
          (await registration?.navigationPreload?.getState())?.enabled ?? null,
        precached,
      };
    });

    expect(state.active).toBe("activated");
    expect(state.scriptURL).toContain("/serwist/sw.js");
    // Cache-first shell: preload would race the cache and can flash an error page offline.
    expect(state.navigationPreloadEnabled).toBe(false);

    // Every app-shell route must be in the precache (revision query param allowed).
    for (const route of APP_SHELL_ROUTES) {
      expect(
        state.precached.some((url) => new URL(url).pathname === route),
        `Expected "${route}" in the service worker precache`
      ).toBe(true);
    }
    // Seeding bundles must be precached for offline first-run seeding.
    for (const bundle of [
      "/data/woodpecker/woodpecker-easy.json",
      "/data/woodpecker/woodpecker-intermediate.json",
      "/data/woodpecker/woodpecker-advanced.json",
    ]) {
      expect(
        state.precached.some((url) => new URL(url).pathname === bundle),
        `Expected "${bundle}" in the service worker precache`
      ).toBe(true);
    }
  });

  test("every app-shell route responds 200 (list matches deployed routes)", async ({
    request,
  }) => {
    for (const route of APP_SHELL_ROUTES) {
      const res = await request.get(route);
      expect(res.status(), `${route} should be a live static route`).toBe(200);
    }
  });
});

test.describe("offline behavior", () => {
  test("training page reloads offline after a single visit", async ({ page, context }) => {
    await page.goto("/app/training");
    await waitForServiceWorker(page);

    await context.setOffline(true);
    await page.reload();

    // Fresh context ⇒ no training set selected; the hydrated app renders its
    // empty state (proves React + IndexedDB ran offline, not a cached error).
    await expect(
      page.getByRole("heading", { name: /no active training selected/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /go to training sets/i })).toBeVisible();
    // And it is the real app, not the offline fallback.
    await expect(page.getByText(/you're offline/i)).toHaveCount(0);
  });

  test("app-shell page never visited before still opens offline", async ({
    page,
    context,
  }) => {
    // Visit ONE page; the whole shell must come from the install-time precache.
    await page.goto("/app/training");
    await waitForServiceWorker(page);

    await context.setOffline(true);
    await page.goto("/app/progress");

    // The app shell (sidebar navigation) renders — page content varies with
    // training state, so assert the shell rather than page-specific copy.
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("link", { name: "Training Sets" })).toBeVisible();
    await expect(page.getByText(/you're offline/i)).toHaveCount(0);
  });

  test("uncached dynamic route falls back to the offline page", async ({
    page,
    context,
  }) => {
    await page.goto("/app/training");
    await waitForServiceWorker(page);

    await context.setOffline(true);
    await page.goto("/app/cycle/nonexistent-cycle-id/summary");

    await expect(page.getByRole("heading", { name: /you're offline/i })).toBeVisible();
    // The fallback's escape hatch must itself work offline.
    await page.getByRole("link", { name: /go to training/i }).click();
    await expect(
      page.getByRole("heading", { name: /no active training selected/i })
    ).toBeVisible();
    await expect(page.getByText(/you're offline/i)).toHaveCount(0);
  });

  test("training library seeds offline from precached bundles", async ({
    page,
    context,
  }) => {
    // First visit installs the SW but does NOT seed (seeding runs on the sets page).
    await page.goto("/app/training");
    await waitForServiceWorker(page);

    await context.setOffline(true);
    await page.goto("/app/sets");

    // Seeding fetches /data/woodpecker/*.json through the SW precache, then
    // renders the three bundled sets. Generous timeout: ~1.5 MB of JSON is
    // parsed and written to IndexedDB.
    await expect(page.getByText("Woodpecker Easy").first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("Woodpecker Intermediate").first()).toBeVisible();
    await expect(page.getByText("Woodpecker Advanced").first()).toBeVisible();
  });
});
