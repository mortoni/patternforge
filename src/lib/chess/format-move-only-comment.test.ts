import { describe, expect, it } from "vitest";
import { formatMoveOnlyComment } from "./format-move-only-comment";

describe("formatMoveOnlyComment", () => {
  it("formats a white-to-move mate line", () => {
    expect(
      formatMoveOnlyComment(["Nxf7", "Rxf7", "Qh7+", "Kf8", "Qh8#"], "w", 25)
    ).toBe("25.Nxf7 Rxf7 26.Qh7+ Kf8 27.Qh8 mate ✓");
  });

  it("formats a black-to-move line from move 1", () => {
    expect(formatMoveOnlyComment(["Qg2+", "Rxg2", "fxg2#"], "b")).toBe(
      "1...Qg2+ 2.Rxg2 fxg2 mate ✓"
    );
  });
});
