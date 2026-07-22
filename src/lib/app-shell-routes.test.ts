import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { APP_SHELL_ROUTES } from "./app-shell-routes";

/**
 * Drift guard for the service worker's app-shell precache list.
 *
 * If a static route under /app is added or renamed without updating
 * APP_SHELL_ROUTES, nothing else fails — the page just silently stops working
 * offline for users who never full-page-navigated to it. This test turns that
 * silent gap into a red build.
 */

const APP_DIR = join(process.cwd(), "src", "app", "app");

/** Recursively collect page.tsx paths under src/app/app. */
function collectPageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectPageFiles(full));
    } else if (entry === "page.tsx") {
      out.push(full);
    }
  }
  return out;
}

/** src/app/app/foo/bar/page.tsx -> /app/foo/bar (posix-style route). */
function toRoute(pageFile: string): string {
  const rel = pageFile
    .slice(APP_DIR.length)
    .split(sep)
    .filter(Boolean)
    .slice(0, -1); // drop page.tsx
  return rel.length === 0 ? "/app" : `/app/${rel.join("/")}`;
}

const isDynamic = (route: string) => route.includes("[");

describe("APP_SHELL_ROUTES (service worker precache list)", () => {
  it("contains every static route under /app that exists on disk", () => {
    const staticRoutes = collectPageFiles(APP_DIR)
      .map(toRoute)
      .filter((r) => !isDynamic(r))
      .sort();

    for (const route of staticRoutes) {
      expect(
        APP_SHELL_ROUTES,
        `Static route "${route}" has a page.tsx but is missing from APP_SHELL_ROUTES — it will not be available offline. Add it to src/lib/app-shell-routes.ts.`
      ).toContain(route);
    }
  });

  it("only lists routes that actually exist on disk", () => {
    for (const route of APP_SHELL_ROUTES) {
      if (route === "/" || route === "/~offline") continue; // covered below
      const rel = route.replace(/^\/app\/?/, "");
      const pageFile = join(APP_DIR, ...rel.split("/").filter(Boolean), "page.tsx");
      expect(
        existsSync(pageFile),
        `APP_SHELL_ROUTES lists "${route}" but ${pageFile} does not exist — stale entries precache 404s.`
      ).toBe(true);
    }
  });

  it("includes the offline fallback and the marketing root", () => {
    expect(APP_SHELL_ROUTES).toContain("/~offline");
    expect(APP_SHELL_ROUTES).toContain("/");
    expect(
      existsSync(join(process.cwd(), "src", "app", "~offline", "page.tsx")),
      "The /~offline fallback page is missing — the service worker precaches it and serves it for uncached navigations."
    ).toBe(true);
  });

  it("contains no dynamic route patterns", () => {
    for (const route of APP_SHELL_ROUTES) {
      expect(
        isDynamic(route),
        `"${route}" is a dynamic route — it cannot be prerendered or precached.`
      ).toBe(false);
    }
  });
});
