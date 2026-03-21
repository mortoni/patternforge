/**
 * Human-friendly session date/time labels (no external date libs).
 * All comparisons use the runtime local timezone.
 */

function localDateParts(d: Date): { y: number; m: number; day: number } {
  return {
    y: d.getFullYear(),
    m: d.getMonth(),
    day: d.getDate(),
  };
}

function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  const pa = localDateParts(a);
  const pb = localDateParts(b);
  return pa.y === pb.y && pa.m === pb.m && pa.day === pb.day;
}

function isLocalYesterday(d: Date, reference: Date): boolean {
  const ref = new Date(reference);
  ref.setDate(ref.getDate() - 1);
  return isSameLocalCalendarDay(d, ref);
}

function formatTimeOfDay(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Calendar-aware line: "Today at 12:47 PM", "Yesterday at …", or "Mar 20 at …".
 * `reference` defaults to now (for tests).
 */
export function formatSessionTime(date: Date, reference: Date = new Date()): string {
  const time = formatTimeOfDay(date);
  if (isSameLocalCalendarDay(date, reference)) {
    return `Today at ${time}`;
  }
  if (isLocalYesterday(date, reference)) {
    return `Yesterday at ${time}`;
  }
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const day = date.getDate();
  return `${month} ${day} at ${time}`;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Short relative phrasing from a reference instant (default: now).
 * Falls back to {@link formatSessionTime} when older than ~24h or in the future.
 */
export function formatRelativeTime(date: Date, reference: Date = new Date()): string {
  const diffMs = reference.getTime() - date.getTime();
  if (diffMs < 0) return formatSessionTime(date, reference);
  if (diffMs < MINUTE_MS) return "just now";
  if (diffMs < HOUR_MS) {
    const m = Math.floor(diffMs / MINUTE_MS);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diffMs < DAY_MS) {
    const h = Math.floor(diffMs / HOUR_MS);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  return formatSessionTime(date, reference);
}

/** Completed within the last ~5 minutes → "just now" banner. */
const JUST_NOW_WINDOW_MS = 5 * MINUTE_MS;

/**
 * Subtle completion line for the session summary header.
 */
export function formatSessionCompletedLine(
  endedAt: Date,
  reference: Date = new Date()
): string {
  const delta = reference.getTime() - endedAt.getTime();
  if (delta >= 0 && delta <= JUST_NOW_WINDOW_MS) {
    return "Session completed just now";
  }
  return `Session completed ${formatSessionTime(endedAt, reference)}`;
}
