import { describe, it, expect } from "vitest";
import {
  getSquaresFromUci,
  getHighlightedSquaresFromMove,
  getArrowFromUci,
} from "./move-highlights";

describe("move-highlights", () => {
  describe("getSquaresFromUci", () => {
    it("parses 4-char UCI to from and to", () => {
      expect(getSquaresFromUci("e2e4")).toEqual(["e2", "e4"]);
      expect(getSquaresFromUci("e7e5")).toEqual(["e7", "e5"]);
    });
    it("parses 5-char UCI with promotion", () => {
      expect(getSquaresFromUci("e7e8q")).toEqual(["e7", "e8"]);
    });
    it("returns null for invalid", () => {
      expect(getSquaresFromUci("")).toBeNull();
      expect(getSquaresFromUci("e4")).toBeNull();
      expect(getSquaresFromUci("invalid")).toBeNull();
    });
  });

  describe("getHighlightedSquaresFromMove", () => {
    it("returns [from, to] for valid UCI", () => {
      expect(getHighlightedSquaresFromMove("e2e4")).toEqual(["e2", "e4"]);
    });
    it("returns empty array for invalid", () => {
      expect(getHighlightedSquaresFromMove("")).toEqual([]);
    });
  });

  describe("getArrowFromUci", () => {
    it("returns arrow with startSquare and endSquare for valid UCI", () => {
      const arrow = getArrowFromUci("e7e5");
      expect(arrow).not.toBeNull();
      expect(arrow!.startSquare).toBe("e7");
      expect(arrow!.endSquare).toBe("e5");
      expect(arrow!.color).toBeDefined();
    });
    it("uses custom color when provided", () => {
      const arrow = getArrowFromUci("e2e4", "red");
      expect(arrow!.color).toBe("red");
    });
    it("returns null for invalid UCI", () => {
      expect(getArrowFromUci("")).toBeNull();
      expect(getArrowFromUci("e4")).toBeNull();
    });
  });
});
