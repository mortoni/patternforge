/**
 * App-shell routes precached by the service worker at install time so the app
 * opens offline even if the user never full-page-navigated to them
 * (client-side navigations don't issue document requests, so runtime caching
 * alone can't cover first use).
 *
 * Every entry must be a statically prerendered route (○/● in `next build`
 * output); dynamic routes (`/app/cycle/[id]/...`) rely on the runtime "pages"
 * cache and the `/~offline` fallback instead.
 *
 * Consumed by `src/app/serwist/[path]/route.ts`. Guarded against drift by
 * `src/lib/app-shell-routes.test.ts` and `e2e/offline.spec.ts`.
 */
export const APP_SHELL_ROUTES = [
  "/",
  "/~offline",
  "/app",
  "/app/analytics",
  "/app/mistakes",
  "/app/progress",
  "/app/session",
  "/app/sets",
  "/app/settings",
  "/app/training",
  "/app/training/session-summary",
] as const;
