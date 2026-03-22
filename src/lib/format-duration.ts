/**
 * Format duration in milliseconds for display.
 * Examples: "5m 20s", "42m", "1h 3m"
 */

export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ");
}

/**
 * Compact duration for chart Y-axes: whole hours only when ≥1h, whole minutes
 * when under an hour but ≥1m, seconds only under a minute.
 */
export function formatDurationMsChartAxis(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/** Format duration in minutes for chart labels (e.g. "5.5" for 5m 30s). */
export function formatDurationMinutes(ms: number): number {
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.round((ms / 60000) * 10) / 10;
}
