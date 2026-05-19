import { describe, it, expect, afterEach } from "vitest";
import {
  parseSupportPromptState,
  DEFAULT_SUPPORT_PROMPT_STATE,
  isSuppressionActive,
} from "./support-prompt-state";

describe("support-prompt-state", () => {
  it("returns defaults for invalid input", () => {
    expect(parseSupportPromptState(null)).toEqual(DEFAULT_SUPPORT_PROMPT_STATE);
    expect(parseSupportPromptState("bad")).toEqual(DEFAULT_SUPPORT_PROMPT_STATE);
    expect(parseSupportPromptState([])).toEqual(DEFAULT_SUPPORT_PROMPT_STATE);
  });

  it("parses valid ISO timestamps and drops invalid fields", () => {
    const iso = "2026-05-19T12:00:00.000Z";
    expect(
      parseSupportPromptState({
        dismissedUntil: iso,
        supportedUntil: "not-a-date",
        lastShownAt: iso,
        extra: "ignored",
      })
    ).toEqual({
      dismissedUntil: iso,
      supportedUntil: null,
      lastShownAt: iso,
    });
  });

  it("isSuppressionActive respects until timestamp", () => {
    const until = "2026-05-20T12:00:00.000Z";
    const before = Date.parse("2026-05-19T12:00:00.000Z");
    const after = Date.parse("2026-05-21T12:00:00.000Z");
    expect(isSuppressionActive(until, before)).toBe(true);
    expect(isSuppressionActive(until, after)).toBe(false);
    expect(isSuppressionActive(null, before)).toBe(false);
  });
});
