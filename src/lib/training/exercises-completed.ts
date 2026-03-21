/**
 * Volume that counts toward "exercises completed" in summaries and analytics.
 * Each skip increments `puzzlesAttempted` and `skippedCount`; we exclude skips from completed volume.
 */
function finiteNonNegative(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function exercisesCompletedExcludingSkips(
  puzzlesAttempted: number,
  skippedCount: number
): number {
  const p = finiteNonNegative(puzzlesAttempted);
  const s = finiteNonNegative(skippedCount);
  return Math.max(0, p - s);
}
