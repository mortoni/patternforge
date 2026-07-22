/// <reference lib="esnext" />
/// <reference lib="webworker" />

/**
 * PatternForge service worker (compiled and served via `/serwist/sw.js`,
 * see `src/app/serwist/[path]/route.ts`).
 *
 * Offline strategy for a local-first app:
 * - App shell / static assets: Serwist's `defaultCache` (hashed `_next/static`
 *   assets are cache-first; documents are network-first with cache fallback).
 * - Woodpecker puzzle bundles (`/data/**`): stale-while-revalidate so seeding
 *   the exercise library works offline after the first visit.
 * - Navigations that miss every cache fall back to `/~offline`.
 *
 * Training progress itself lives in IndexedDB and needs no service worker.
 */

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  disableNavigationPreload,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  // Off on purpose: the app shell is served cache-first from the precache, so
  // the parallel network request preload fires is wasted online and can paint
  // a brief browser error flash offline. `navigationPreload: false` only
  // skips enabling — registrations that had it enabled by an earlier worker
  // version keep the flag, so it is explicitly disabled on activate below.
  navigationPreload: false,
  runtimeCaching: [
    /**
     * Navigations, handled ahead of `defaultCache`. Must be constructed from
     * OUR `serwist` import: Serwist only attaches the offline-fallback plugin
     * to handlers that pass `instanceof Strategy`, and `defaultCache`'s
     * handlers can come from a second bundled copy of `serwist` (pnpm keys
     * instances by peer-dep set), which fails that check and would silently
     * drop the `/~offline` fallback for pages.
     */
    {
      matcher: ({ request, sameOrigin }) => sameOrigin && request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && url.pathname.startsWith("/data/"),
      handler: new StaleWhileRevalidate({
        cacheName: "pf-puzzle-data",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && (url.pathname === "/manifest.json" || url.pathname === "/icon.png"),
      handler: new CacheFirst({
        cacheName: "pf-pwa-assets",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 8,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.mode === "navigate" || request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Registers an activate-time cleanup that turns the flag off for
// registrations where an earlier worker version had enabled it.
disableNavigationPreload();
