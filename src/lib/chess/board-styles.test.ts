import { describe, it, expect } from "vitest";
import {
  BOARD_STYLE_IDS,
  BOARD_STYLE_MAP,
  getBoardStylePreviewCellStyles,
  parseBoardStyleId,
  resolveBoardChessStyles,
} from "./board-styles";

describe("board-styles", () => {
  describe("BOARD_STYLE_MAP", () => {
    it("includes Classic, Classic (Lichess), and Blueprint", () => {
      expect(BOARD_STYLE_IDS).toEqual([
        "classic",
        "classic-lichess",
        "blueprint",
      ]);
      expect(BOARD_STYLE_MAP.classic.label).toBe("Classic");
      expect(BOARD_STYLE_MAP["classic-lichess"].label).toBe("Classic (Lichess)");
      expect(BOARD_STYLE_MAP.blueprint.label).toBe("Blueprint");
    });

    it("Classic (Lichess) uses Lichess default square colours in both app modes", () => {
      const def = BOARD_STYLE_MAP["classic-lichess"];
      expect(def.kind).toBe("solid-checker");
      if (def.kind !== "solid-checker") {
        throw new Error("expected solid-checker board style");
      }

      const light = def.variants.light;
      const dark = def.variants.dark;
      expect(light.lightSquare).toBe("#f0d9b5");
      expect(light.darkSquare).toBe("#b58863");
      expect(dark.lightSquare).toBe("#f0d9b5");
      expect(dark.darkSquare).toBe("#b58863");
    });
  });

  describe("parseBoardStyleId", () => {
    it.each(BOARD_STYLE_IDS)("accepts valid id %s", (id) => {
      expect(parseBoardStyleId(id)).toBe(id);
    });

    it("falls back to classic-lichess for unknown values", () => {
      expect(parseBoardStyleId("wood")).toBe("classic-lichess");
      expect(parseBoardStyleId(42)).toBe("classic-lichess");
    });

    it("falls back to classic-lichess when boardStyle is missing", () => {
      expect(parseBoardStyleId(undefined)).toBe("classic-lichess");
      expect(parseBoardStyleId(null)).toBe("classic-lichess");
      expect(parseBoardStyleId("")).toBe("classic-lichess");
    });
  });

  describe("resolveBoardChessStyles", () => {
    it("applies solid checker styles for classic-lichess without hatch patterns", () => {
      const resolved = resolveBoardChessStyles("classic-lichess", {
        colorScheme: "light",
      });

      expect(resolved.boardStyleId).toBe("classic-lichess");
      expect(resolved.lightSquareStyle).toEqual({
        backgroundColor: "#f0d9b5",
      });
      expect(resolved.darkSquareStyle).toEqual({
        backgroundColor: "#b58863",
      });
      expect(resolved.cgBoardAppearance?.backgroundImage).toMatch(
        /^url\("data:image\/svg\+xml,/
      );
      expect(resolved.cgBoardAppearance?.backgroundImage).not.toContain(
        "pattern"
      );
    });

    it("keeps classic and blueprint behaviour unchanged", () => {
      const classic = resolveBoardChessStyles("classic", { colorScheme: "dark" });
      expect(classic.boardStyleId).toBe("classic");
      expect(classic.darkSquareStyle).toEqual({ backgroundColor: "#2D2842" });

      const blueprint = resolveBoardChessStyles("blueprint", {
        colorScheme: "light",
      });
      expect(blueprint.boardStyleId).toBe("blueprint");
      expect(blueprint.cgBoardAppearance?.backgroundImage).toContain("pattern");
    });
  });

  describe("getBoardStylePreviewCellStyles", () => {
    it("returns Lichess preview colours for classic-lichess", () => {
      const preview = getBoardStylePreviewCellStyles(
        BOARD_STYLE_MAP["classic-lichess"],
        "light"
      );
      expect(preview.light).toEqual({ backgroundColor: "#f0d9b5" });
      expect(preview.dark).toEqual({ backgroundColor: "#b58863" });
    });
  });
});
