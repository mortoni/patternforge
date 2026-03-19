import { describe, expect, it } from "vitest";
import {
  CHESS_NOTATION_CORRUPTED_CHAR_MAP,
  normalizeChessNotation,
} from "./normalize-chess-notation";

describe("normalizeChessNotation", () => {
  it("maps £ and ¦ to Q and R (acceptance example)", () => {
    expect(normalizeChessNotation("£xf3 ¦xc4–+")).toBe("Qxf3 Rxc4–+");
  });

  it("maps book-font pieces and dagger check", () => {
    expect(normalizeChessNotation("19.£xc4 ¤e3† 20.¢e2")).toBe(
      "19.Qxc4 Ne3+ 20.Ke2"
    );
  });

  it("leaves annotations and punctuation", () => {
    expect(normalizeChessNotation("28.Qh5?! 0–1 ✓")).toBe(
      "28.Qh5?! 0–1 ✓"
    );
  });

  it("maps figurine unicode to letters", () => {
    expect(normalizeChessNotation("\u2658f6")).toBe("Nf6");
  });

  it("exposes extendable map", () => {
    expect(CHESS_NOTATION_CORRUPTED_CHAR_MAP["\u00A3"]).toBe("Q");
  });
});
