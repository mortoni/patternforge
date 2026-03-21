/**
 * Display helpers for Session Summary (Woodpecker checkpoint — no correctness signals).
 */

export function formatCycleProgressLabel(
  position: number,
  total: number
): string {
  if (!Number.isFinite(total) || total <= 0) return "—";
  const pos = Math.min(Math.max(0, position), total);
  return `${pos} / ${total} exercises`;
}

/** Rounded percent through the cycle (0–100); null when total is not meaningful. */
export function cycleProgressPercentRounded(
  position: number,
  total: number
): number | null {
  if (!Number.isFinite(total) || total <= 0) return null;
  const pos = Math.min(Math.max(0, position), total);
  return Math.round((pos / total) * 100);
}

/** Subtle encouragement from time and volume only; returns null when it would feel forced. */
export function sessionEncouragementLine(
  activeTimeMs: number,
  puzzlesAttempted: number
): string | null {
  if (puzzlesAttempted <= 0) return null;
  if (activeTimeMs < 180_000 && puzzlesAttempted < 6) {
    return "Nice short session. Consistency matters.";
  }
  if (puzzlesAttempted >= 12 || activeTimeMs >= 900_000) {
    return "Solid stretch of focus today.";
  }
  if (puzzlesAttempted >= 6 && activeTimeMs >= 420_000) {
    return "Solid progress for today.";
  }
  return null;
}
