import type { SessionSchema } from "@/db/schema";

/**
 * Use stored `skippedCount` when valid, but never below the count of `skipped`
 * rows in `exerciseAttempts` (repairs legacy NaN / missing `skippedCount`).
 */
export function effectiveSkippedCount(
  sess: Pick<SessionSchema, "id" | "skippedCount">,
  skippedFromAttempts: Map<string, number>
): number {
  const fromAttempts = skippedFromAttempts.get(sess.id) ?? 0;
  const stored = sess.skippedCount;
  const storedSafe =
    typeof stored === "number" && Number.isFinite(stored) && stored >= 0
      ? stored
      : 0;
  return Math.max(storedSafe, fromAttempts);
}
