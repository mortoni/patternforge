import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline — Pattern Forge",
};

/**
 * Service-worker fallback for navigations that miss every cache
 * (see `fallbacks` in `src/app/sw.ts`). Pages you have visited before are
 * served from the runtime cache instead, so most offline navigation never
 * lands here.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">
        You&apos;re offline
      </h1>
      <p className="max-w-sm text-sm text-[var(--muted-foreground)]">
        This page isn&apos;t available without a connection yet. Your training
        data is stored on this device — pages you&apos;ve opened before are
        still available.
      </p>
      <Link
        href="/app/training"
        className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)]"
      >
        Go to training
      </Link>
    </main>
  );
}
