/**
 * Date utilities. Re-export or wrap date-fns as needed.
 */

import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";

export { format, formatDistanceToNow, isToday, isYesterday, parseISO };

export function toISOString(date: Date): string {
  return date.toISOString();
}

export function fromISOString(iso: string): Date {
  return parseISO(iso);
}
