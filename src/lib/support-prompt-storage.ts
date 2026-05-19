import {
  DEFAULT_SUPPORT_PROMPT_STATE,
  isSuppressionActive,
  LEGACY_SUPPORT_PROMPT_STORAGE_KEY,
  parseSupportPromptState,
  SUPPORT_PROMPT_COOLDOWN_DAYS,
  SUPPORT_PROMPT_DISMISS_DAYS,
  SUPPORT_PROMPT_STORAGE_KEY,
  SUPPORT_PROMPT_SUPPORTED_DAYS,
  type SupportPromptState,
} from "./support-prompt-state";

export {
  DEFAULT_SUPPORT_PROMPT_STATE,
  SUPPORT_PROMPT_COOLDOWN_DAYS,
  SUPPORT_PROMPT_DISMISS_DAYS,
  SUPPORT_PROMPT_STORAGE_KEY,
  SUPPORT_PROMPT_SUPPORTED_DAYS,
  type SupportPromptState,
} from "./support-prompt-state";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** sessionStorage — avoid showing again when navigating reflection → cycle summary. */
const SESSION_SHOWN_KEY = "patternforge-support-prompt-shown-session";

function addDaysIso(nowMs: number, days: number): string {
  return new Date(nowMs + days * MS_PER_DAY).toISOString();
}

function readRawStateJson(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SUPPORT_PROMPT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeState(state: SupportPromptState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SUPPORT_PROMPT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode, quota, or disabled storage — fail silently.
  }
}

function migrateLegacyHiddenUntil(): SupportPromptState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_SUPPORT_PROMPT_STORAGE_KEY);
    if (!raw) return null;
    const hiddenUntilMs = Number(raw);
    window.localStorage.removeItem(LEGACY_SUPPORT_PROMPT_STORAGE_KEY);
    if (!Number.isFinite(hiddenUntilMs)) return null;
    return {
      ...DEFAULT_SUPPORT_PROMPT_STATE,
      dismissedUntil: new Date(hiddenUntilMs).toISOString(),
    };
  } catch {
    return null;
  }
}

/** Read persisted prompt state; malformed JSON falls back to defaults. */
export function getSupportPromptState(): SupportPromptState {
  const migrated = migrateLegacyHiddenUntil();
  if (migrated) {
    writeState(migrated);
    return migrated;
  }

  const raw = readRawStateJson();
  if (!raw) {
    return { ...DEFAULT_SUPPORT_PROMPT_STATE };
  }

  try {
    return parseSupportPromptState(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SUPPORT_PROMPT_STATE };
  }
}

function wasShownThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

function markShownThisSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
  } catch {
    // ignore
  }
}

/**
 * Whether the support prompt may appear now (storage + session + cooldown).
 * Does not check training milestones — combine with eligibility separately.
 */
export function canShowSupportPrompt(nowMs = Date.now()): boolean {
  if (wasShownThisSession()) {
    return false;
  }

  const state = getSupportPromptState();

  if (isSuppressionActive(state.dismissedUntil, nowMs)) {
    return false;
  }
  if (isSuppressionActive(state.supportedUntil, nowMs)) {
    return false;
  }

  if (state.lastShownAt != null) {
    const lastShownMs = Date.parse(state.lastShownAt);
    if (
      Number.isFinite(lastShownMs) &&
      nowMs < lastShownMs + SUPPORT_PROMPT_COOLDOWN_DAYS * MS_PER_DAY
    ) {
      return false;
    }
  }

  return true;
}

/** “Maybe later” — suppress for 14 days. */
export function dismissSupportPrompt(nowMs = Date.now()): void {
  const state = getSupportPromptState();
  writeState({
    ...state,
    dismissedUntil: addDaysIso(nowMs, SUPPORT_PROMPT_DISMISS_DAYS),
  });
}

/**
 * User opened support — suppress for 90 days.
 * UX-only signal; not tied to Stripe or payment completion.
 */
export function markUserAsSupported(nowMs = Date.now()): void {
  const state = getSupportPromptState();
  writeState({
    ...state,
    supportedUntil: addDaysIso(nowMs, SUPPORT_PROMPT_SUPPORTED_DAYS),
  });
}

/** Record that the prompt was displayed (starts 7-day display cooldown). */
export function recordSupportPromptShown(nowMs = Date.now()): void {
  const state = getSupportPromptState();
  writeState({
    ...state,
    lastShownAt: new Date(nowMs).toISOString(),
  });
  markShownThisSession();
}

/** Test helper — clears local and session suppression. */
export function clearSupportPromptState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SUPPORT_PROMPT_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_SUPPORT_PROMPT_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_SHOWN_KEY);
  } catch {
    // ignore
  }
}
