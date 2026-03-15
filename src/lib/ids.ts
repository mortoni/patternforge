/**
 * Generate unique IDs for client-side entities.
 * Uses crypto.randomUUID when available, fallback for older envs.
 */

export function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}
