import { describe, it, expect, afterEach } from "vitest";
import {
  canShowSupportPrompt,
  clearSupportPromptState,
  dismissSupportPrompt,
  getSupportPromptState,
  markUserAsSupported,
  recordSupportPromptShown,
  SUPPORT_PROMPT_COOLDOWN_DAYS,
  SUPPORT_PROMPT_DISMISS_DAYS,
  SUPPORT_PROMPT_STORAGE_KEY,
  SUPPORT_PROMPT_SUPPORTED_DAYS,
} from "./support-prompt-storage";

describe("support-prompt-storage", () => {
  afterEach(() => {
    clearSupportPromptState();
  });

  it("allows prompts when state is empty", () => {
    expect(canShowSupportPrompt()).toBe(true);
    expect(getSupportPromptState()).toEqual({
      dismissedUntil: null,
      supportedUntil: null,
      lastShownAt: null,
    });
  });

  it("dismiss suppresses prompts for 14 days", () => {
    const now = Date.parse("2026-05-19T12:00:00.000Z");
    dismissSupportPrompt(now);

    const state = getSupportPromptState();
    expect(state.dismissedUntil).toBe(
      new Date(now + SUPPORT_PROMPT_DISMISS_DAYS * 24 * 60 * 60 * 1000).toISOString()
    );
    expect(canShowSupportPrompt(now + 1)).toBe(false);
    expect(
      canShowSupportPrompt(now + SUPPORT_PROMPT_DISMISS_DAYS * 24 * 60 * 60 * 1000)
    ).toBe(true);
  });

  it("support CTA suppresses prompts for 90 days", () => {
    const now = Date.parse("2026-05-19T12:00:00.000Z");
    markUserAsSupported(now);

    const state = getSupportPromptState();
    expect(state.supportedUntil).toBe(
      new Date(now + SUPPORT_PROMPT_SUPPORTED_DAYS * 24 * 60 * 60 * 1000).toISOString()
    );
    expect(canShowSupportPrompt(now + 30 * 24 * 60 * 60 * 1000)).toBe(false);
    expect(
      canShowSupportPrompt(now + SUPPORT_PROMPT_SUPPORTED_DAYS * 24 * 60 * 60 * 1000)
    ).toBe(true);
  });

  it("enforces a 7-day cooldown between displays", () => {
    const now = Date.parse("2026-05-19T12:00:00.000Z");
    recordSupportPromptShown(now);

    expect(canShowSupportPrompt(now + 1)).toBe(false);
    expect(
      canShowSupportPrompt(now + (SUPPORT_PROMPT_COOLDOWN_DAYS - 1) * 24 * 60 * 60 * 1000)
    ).toBe(false);
    expect(
      canShowSupportPrompt(now + SUPPORT_PROMPT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
    ).toBe(false);

    clearSupportPromptState();
    window.sessionStorage.removeItem("patternforge-support-prompt-shown-session");

    const state = getSupportPromptState();
    state.lastShownAt = new Date(now).toISOString();
    window.localStorage.setItem(SUPPORT_PROMPT_STORAGE_KEY, JSON.stringify(state));

    expect(
      canShowSupportPrompt(now + SUPPORT_PROMPT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
    ).toBe(true);
  });

  it("does not show again in the same session after being shown", () => {
    const now = Date.parse("2026-05-19T12:00:00.000Z");
    recordSupportPromptShown(now);

    window.localStorage.removeItem(SUPPORT_PROMPT_STORAGE_KEY);
    expect(canShowSupportPrompt(now + 30 * 24 * 60 * 60 * 1000)).toBe(false);
  });

  it("handles malformed localStorage JSON safely", () => {
    window.localStorage.setItem(SUPPORT_PROMPT_STORAGE_KEY, "{not valid json");
    expect(getSupportPromptState()).toEqual({
      dismissedUntil: null,
      supportedUntil: null,
      lastShownAt: null,
    });
    expect(canShowSupportPrompt()).toBe(true);
  });

  it("migrates legacy hidden-until timestamp into dismissedUntil", () => {
    const untilMs = Date.parse("2026-06-01T12:00:00.000Z");
    window.localStorage.setItem(
      "patternforge-support-prompt-hidden-until",
      String(untilMs)
    );

    const state = getSupportPromptState();
    expect(state.dismissedUntil).toBe(new Date(untilMs).toISOString());
    expect(
      window.localStorage.getItem("patternforge-support-prompt-hidden-until")
    ).toBeNull();
  });
});
