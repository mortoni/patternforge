/** Suppression durations — adjust here to tune prompt frequency. */
export const SUPPORT_PROMPT_DISMISS_DAYS = 14;
/** “Support the project” — respectful long pause (not payment verification). */
export const SUPPORT_PROMPT_SUPPORTED_DAYS = 90;
/** Minimum gap between prompt displays even without explicit dismissal. */
export const SUPPORT_PROMPT_COOLDOWN_DAYS = 7;

export const SUPPORT_PROMPT_STORAGE_KEY = "patternforge-support-prompt-state";

/** Legacy Task 6 key — migrated on read when present. */
export const LEGACY_SUPPORT_PROMPT_STORAGE_KEY =
  "patternforge-support-prompt-hidden-until";

export type SupportPromptState = {
  dismissedUntil: string | null;
  supportedUntil: string | null;
  lastShownAt: string | null;
};

export const DEFAULT_SUPPORT_PROMPT_STATE: SupportPromptState = {
  dismissedUntil: null,
  supportedUntil: null,
  lastShownAt: null,
};

function parseIsoTimestamp(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

/** Safely coerce unknown JSON into a valid state object. */
export function parseSupportPromptState(raw: unknown): SupportPromptState {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_SUPPORT_PROMPT_STATE };
  }

  const record = raw as Record<string, unknown>;
  return {
    dismissedUntil: parseIsoTimestamp(record.dismissedUntil),
    supportedUntil: parseIsoTimestamp(record.supportedUntil),
    lastShownAt: parseIsoTimestamp(record.lastShownAt),
  };
}

export function isSuppressionActive(
  untilIso: string | null,
  nowMs: number
): boolean {
  if (untilIso == null) return false;
  const untilMs = Date.parse(untilIso);
  return Number.isFinite(untilMs) && nowMs < untilMs;
}
