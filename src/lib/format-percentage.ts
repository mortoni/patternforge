/**
 * Format a ratio as a percentage for display.
 */

export function formatPercentage(value: number, total: number, decimals = 0): string {
  if (!Number.isFinite(total) || total <= 0) return "0%";
  const pct = (value / total) * 100;
  return `${pct.toFixed(decimals)}%`;
}

/** Format a 0–1 fraction as percentage. */
export function formatPercentageFromFraction(fraction: number, decimals = 0): string {
  if (!Number.isFinite(fraction)) return "0%";
  return `${(fraction * 100).toFixed(decimals)}%`;
}
