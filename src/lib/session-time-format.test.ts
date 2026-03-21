import { describe, it, expect } from "vitest";
import {
  formatSessionTime,
  formatRelativeTime,
  formatSessionCompletedLine,
} from "./session-time-format";

describe("formatSessionTime", () => {
  it("uses Today for same calendar day", () => {
    const ref = new Date("2025-03-20T15:00:00");
    const d = new Date("2025-03-20T12:47:00");
    const s = formatSessionTime(d, ref);
    expect(s).toMatch(/^Today at /);
  });

  it("uses Yesterday for previous calendar day", () => {
    const ref = new Date("2025-03-20T15:00:00");
    const d = new Date("2025-03-19T12:47:00");
    const s = formatSessionTime(d, ref);
    expect(s).toMatch(/^Yesterday at /);
  });

  it("uses month and day for older dates", () => {
    const ref = new Date("2025-03-20T15:00:00");
    const d = new Date("2025-03-10T12:47:00");
    const s = formatSessionTime(d, ref);
    expect(s).toMatch(/ at /);
    expect(s).not.toMatch(/^Today/);
    expect(s).not.toMatch(/^Yesterday/);
  });
});

describe("formatRelativeTime", () => {
  it("returns just now for under one minute", () => {
    const ref = new Date("2025-03-20T12:01:00");
    const d = new Date("2025-03-20T12:00:30");
    expect(formatRelativeTime(d, ref)).toBe("just now");
  });

  it("returns minutes ago within an hour", () => {
    const ref = new Date("2025-03-20T12:30:00");
    const d = new Date("2025-03-20T12:10:00");
    expect(formatRelativeTime(d, ref)).toBe("20 minutes ago");
  });
});

describe("formatSessionCompletedLine", () => {
  it("returns just now within 5 minutes", () => {
    const ref = new Date("2025-03-20T12:05:00");
    const ended = new Date("2025-03-20T12:02:00");
    expect(formatSessionCompletedLine(ended, ref)).toBe(
      "Session completed just now"
    );
  });

  it("includes formatted time when older than 5 minutes", () => {
    const ref = new Date("2025-03-20T12:48:00");
    const ended = new Date("2025-03-20T12:40:00");
    const line = formatSessionCompletedLine(ended, ref);
    expect(line.startsWith("Session completed ")).toBe(true);
    expect(line).not.toContain("just now");
  });
});
