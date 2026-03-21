/**
 * Single source of truth for chessboard square colors and frame tokens.
 * Consumed by TrainingBoardCard and Settings previews.
 */

import type { CSSProperties } from "react";
import type { PieceRenderObject } from "react-chessboard";

export const BOARD_STYLE_IDS = [
  "classic",
  "walnut",
  "slate",
  "forest",
  "tournament",
  /** Dark monochrome board: charcoal light squares, hatched dark squares (see MT reference). */
  "mtModel",
] as const;

export type BoardStyleId = (typeof BOARD_STYLE_IDS)[number];

/** Matches react-chessboard defaults (classic wood). */
const CLASSIC_LIGHT = "#F0D9B5";
const CLASSIC_DARK = "#B58863";

/** Optional overrides for selection / legal-move overlays (TrainingBoardCard). */
export interface BoardInteractionStyles {
  selectedSquare: CSSProperties;
  legalDot: CSSProperties;
  legalCapture: CSSProperties;
}

export interface BoardStyleDefinition {
  id: BoardStyleId;
  label: string;
  /** Fallback hex when full `lightSquareStyle` / `darkSquareStyle` not used */
  lightSquare: string;
  darkSquare: string;
  /**
   * Full CSS for light squares (overrides `lightSquare` background-only).
   * Use for complex surfaces; omit for solid `lightSquare` color.
   */
  lightSquareStyle?: CSSProperties;
  /**
   * Full CSS for dark squares (e.g. diagonal hatch pattern).
   */
  darkSquareStyle?: CSSProperties;
  /**
   * Optional background behind squares (react-chessboard `boardStyle`).
   * Omit for `classic` so library defaults apply.
   */
  boardBackground?: string;
  /**
   * When set, TrainingBoardCard outer frame uses these instead of theme `border` / `muted`.
   */
  frameBackground?: string;
  frameBorder?: string;
  /** Selection + legal move indicators; defaults used when omitted */
  interaction?: BoardInteractionStyles;
  /** File/rank labels on dark vs light squares */
  notation?: {
    darkSquareNotationStyle: CSSProperties;
    lightSquareNotationStyle: CSSProperties;
  };
}

export const BOARD_STYLE_MAP: Record<BoardStyleId, BoardStyleDefinition> = {
  classic: {
    id: "classic",
    label: "Classic",
    lightSquare: CLASSIC_LIGHT,
    darkSquare: CLASSIC_DARK,
  },
  walnut: {
    id: "walnut",
    label: "Walnut",
    lightSquare: "#e8dcc8",
    darkSquare: "#4a3024",
    boardBackground: "#2a1f1a",
    frameBackground: "rgba(42, 31, 26, 0.35)",
    frameBorder: "rgba(74, 48, 36, 0.5)",
  },
  slate: {
    id: "slate",
    label: "Slate",
    lightSquare: "#c9d4dc",
    darkSquare: "#3d4f5c",
    boardBackground: "#1e2830",
    frameBackground: "rgba(30, 40, 48, 0.4)",
    frameBorder: "rgba(80, 96, 112, 0.45)",
  },
  forest: {
    id: "forest",
    label: "Forest",
    lightSquare: "#d4e3d6",
    darkSquare: "#2f4a38",
    boardBackground: "#1c2a22",
    frameBackground: "rgba(28, 42, 34, 0.4)",
    frameBorder: "rgba(61, 90, 72, 0.5)",
  },
  tournament: {
    id: "tournament",
    label: "Tournament",
    lightSquare: "#eeeed2",
    darkSquare: "#769656",
    boardBackground: "#262421",
    frameBackground: "rgba(38, 36, 33, 0.35)",
    frameBorder: "rgba(90, 85, 75, 0.45)",
  },
  /**
   * Inspired by a dark, minimal training UI: flat charcoal “light” squares,
   * hatched darker squares, deep blue selection, subtle grey move dots.
   * Piece graphics remain the default react-chessboard set.
   */
  mtModel: {
    id: "mtModel",
    label: "MT (dark)",
    lightSquare: "#2d2d2d",
    darkSquare: "#0e0e0e",
    lightSquareStyle: { backgroundColor: "#2d2d2d" },
    /**
     * Dark squares: diagonal hatch with fewer, farther-spaced lines so each stripe reads clearly.
     * ~10px repeat: wide gap + 2px hairline at higher contrast than the old dense 2px pattern.
     */
    darkSquareStyle: {
      backgroundColor: "#0e0e0e",
      backgroundImage: `repeating-linear-gradient(
        135deg,
        transparent 0,
        transparent 8px,
        rgba(255, 255, 255, 0.2) 8px,
        rgba(255, 255, 255, 0.2) 10px
      )`,
    },
    boardBackground: "#0f0f0f",
    frameBackground: "rgba(15, 15, 15, 0.95)",
    frameBorder: "rgba(255, 255, 255, 0.09)",
    interaction: {
      selectedSquare: {
        backgroundColor: "#2b3d63",
        boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
      },
      legalDot: {
        backgroundImage:
          "radial-gradient(circle at center, rgba(200, 200, 200, 0.42) 0%, rgba(200, 200, 200, 0.42) 11%, transparent 12%)",
      },
      legalCapture: {
        boxShadow: "inset 0 0 0 2px rgba(200, 200, 200, 0.45)",
        borderRadius: "50%",
      },
    },
    notation: {
      darkSquareNotationStyle: {
        color: "rgba(255, 255, 255, 0.42)",
        fontSize: "11px",
      },
      lightSquareNotationStyle: {
        color: "rgba(255, 255, 255, 0.42)",
        fontSize: "11px",
      },
    },
  },
};

export function parseBoardStyleId(value: unknown): BoardStyleId {
  if (
    typeof value === "string" &&
    (BOARD_STYLE_IDS as readonly string[]).includes(value)
  ) {
    return value as BoardStyleId;
  }
  return "classic";
}

export interface ResolvedBoardChessStyles {
  lightSquareStyle: CSSProperties;
  darkSquareStyle: CSSProperties;
  /** When present, merged into ChessboardProvider options.boardStyle */
  boardStyle?: CSSProperties;
  /**
   * Inline frame for the outer board shell; `null` keeps TrainingBoardCard theme classes (classic).
   */
  frame: { backgroundColor: string; borderColor: string } | null;
  interaction?: BoardInteractionStyles;
  notation?: BoardStyleDefinition["notation"];
  /**
   * Custom piece render map (e.g. MT style outlines black pieces only).
   * Omitted when using library defaults.
   */
  pieces?: PieceRenderObject;
}

export function resolveBoardChessStyles(id: BoardStyleId): ResolvedBoardChessStyles {
  const def = BOARD_STYLE_MAP[id];
  const lightSquareStyle: CSSProperties =
    def.lightSquareStyle ?? { backgroundColor: def.lightSquare };
  const darkSquareStyle: CSSProperties =
    def.darkSquareStyle ?? { backgroundColor: def.darkSquare };
  const boardStyle =
    def.boardBackground != null
      ? { backgroundColor: def.boardBackground }
      : undefined;
  const frame =
    def.frameBackground != null && def.frameBorder != null
      ? {
          backgroundColor: def.frameBackground,
          borderColor: def.frameBorder,
        }
      : null;

  return {
    lightSquareStyle,
    darkSquareStyle,
    boardStyle,
    frame,
    interaction: def.interaction,
    notation: def.notation,
  };
}

/** Settings preview swatches: full CSS per checker cell. */
export function getBoardStylePreviewCellStyles(def: BoardStyleDefinition): {
  light: CSSProperties;
  dark: CSSProperties;
} {
  return {
    light: def.lightSquareStyle ?? { backgroundColor: def.lightSquare },
    dark: def.darkSquareStyle ?? { backgroundColor: def.darkSquare },
  };
}
