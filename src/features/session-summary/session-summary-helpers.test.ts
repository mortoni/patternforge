import { describe, it, expect } from "vitest";
import {
  cycleProgressPercentRounded,
  formatCycleProgressLabel,
  sessionEncouragementLine,
} from "./session-summary-helpers";

describe("formatCycleProgressLabel", () => {
  it("formats position and total", () => {
    expect(formatCycleProgressLabel(13, 222)).toBe("13 / 222 exercises");
  });

  it("returns placeholder when total invalid", () => {
    expect(formatCycleProgressLabel(0, 0)).toBe("—");
  });
});

describe("cycleProgressPercentRounded", () => {
  it("rounds percent through the cycle", () => {
    expect(cycleProgressPercentRounded(9, 222)).toBe(4);
    expect(cycleProgressPercentRounded(222, 222)).toBe(100);
    expect(cycleProgressPercentRounded(0, 100)).toBe(0);
  });

  it("returns null when total invalid", () => {
    expect(cycleProgressPercentRounded(0, 0)).toBeNull();
  });
});

describe("sessionEncouragementLine", () => {
  it("returns null for zero exercises", () => {
    expect(sessionEncouragementLine(60_000, 0)).toBeNull();
  });
});
