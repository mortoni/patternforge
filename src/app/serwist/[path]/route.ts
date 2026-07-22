import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";
import { APP_SHELL_ROUTES } from "@/lib/app-shell-routes";

/**
 * Serves the compiled service worker at `/serwist/sw.js` (see `src/app/sw.ts`).
 * Bundler-agnostic (esbuild) so it works with Turbopack builds.
 *
 * Precached URLs are revisioned by the current git commit so a deploy
 * invalidates stale precache entries.
 */
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: APP_SHELL_ROUTES.map((url) => ({ url, revision })),
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
    // Keep the install-time precache lean: heavy marketing/docs assets and
    // internal reports are runtime-cached on first view instead (see sw.ts).
    globIgnores: [
      "public/crystal-1.png",
      "public/easy-pdf.pdf",
      "public/icon-1024.png",
      "public/images/**",
      "public/data/reports/**",
    ],
  });
