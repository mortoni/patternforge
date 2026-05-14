/**
 * Board themes: each id maps to definitions; non-solid-checker themes use
 * extra fields (e.g. hatch). Resolve with app shell mode for light/dark pairs.
 */

import type { CSSProperties } from "react";

export type AppColorScheme = "light" | "dark";

export const BOARD_STYLE_IDS = ["classic", "blueprint"] as const;

export type BoardStyleId = (typeof BOARD_STYLE_IDS)[number];

/** Default board: soft lilac (light shell) vs deep violet (dark shell). */
const CLASSIC_APP_LIGHT = {
  lightSquare: "#F4F0FD",
  darkSquare: "#D8CCEF",
  boardBackground: "#EEEBFA",
  frameBackground: "rgba(250, 248, 255, 0.96)",
  frameBorder: "rgba(100, 82, 140, 0.16)",
  coordColor: "rgba(72, 62, 108, 0.6)",
} as const;

const CLASSIC_APP_DARK = {
  lightSquare: "#4A4568",
  darkSquare: "#2D2842",
  boardBackground: "#15131E",
  frameBackground: "rgba(26, 24, 36, 0.94)",
  frameBorder: "rgba(190, 180, 235, 0.14)",
  coordColor: "rgba(205, 200, 232, 0.66)",
} as const;

export interface SolidBoardVariant {
  lightSquare: string;
  darkSquare: string;
  boardBackground: string;
  frameBackground: string;
  frameBorder: string;
  coordColor: string;
}

export interface BoardThemeVariant {
  chessLightSquare: string;
  chessDarkSquare: string;
  hatchBase: string;
  hatchLine: string;
  hatchOnLightChessSquares: boolean;
  boardBackground: string;
  frameBackground: string;
  frameBorder: string;
  coordColor: string;
}

export type BoardStyleDefinition =
  | {
      kind: "solid-checker";
      id: "classic";
      label: string;
      description?: string;
      /** Settings preview — app-light pair */
      lightSquare: string;
      darkSquare: string;
      variants: Record<AppColorScheme, SolidBoardVariant>;
    }
  | {
      kind: "blueprint-grid";
      id: "blueprint";
      label: string;
      description?: string;
      lightSquare: string;
      darkSquare: string;
      variants: Record<AppColorScheme, BoardThemeVariant>;
    };

function svgSolidCheckerboardUrl(lightSquare: string, darkSquare: string): string {
  const cells: string[] = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const isLightChess = (r + f) % 2 === 0;
      const fill = isLightChess ? lightSquare : darkSquare;
      cells.push(`<rect x="${f}" y="${r}" width="1" height="1" fill="${fill}"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" preserveAspectRatio="none">${cells.join("")}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function svgBlueprintBoardUrl(v: BoardThemeVariant): string {
  const pid = "pf-bp-h";
  const cells: string[] = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const isLightChess = (r + f) % 2 === 0;
      const hatched = v.hatchOnLightChessSquares ? isLightChess : !isLightChess;
      const solid = isLightChess ? v.chessLightSquare : v.chessDarkSquare;
      const fill = hatched ? `url(#${pid})` : solid;
      cells.push(`<rect x="${f}" y="${r}" width="1" height="1" fill="${fill}"/>`);
    }
  }
  const pattern = `<pattern id="${pid}" patternUnits="userSpaceOnUse" width="0.125" height="0.125"><rect width="0.125" height="0.125" fill="${v.hatchBase}"/><line x1="0" y1="0.125" x2="0.125" y2="0" stroke="${v.hatchLine}" stroke-width="0.019" stroke-linecap="square"/><line x1="-0.0625" y1="0.0625" x2="0.0625" y2="-0.0625" stroke="${v.hatchLine}" stroke-width="0.019" stroke-linecap="square"/></pattern>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" preserveAspectRatio="none"><defs>${pattern}</defs>${cells.join("")}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const BLUEPRINT_APP_LIGHT: BoardThemeVariant = {
  chessLightSquare: "#f0f0f0",
  chessDarkSquare: "#d0d0d0",
  hatchBase: "#d0d0d0",
  hatchLine: "rgba(40,45,55,0.22)",
  hatchOnLightChessSquares: false,
  boardBackground: "#eaeaea",
  frameBackground: "rgba(248, 248, 248, 0.94)",
  frameBorder: "rgba(120, 120, 135, 0.2)",
  coordColor: "rgba(100, 105, 115, 0.75)",
};

const BLUEPRINT_APP_DARK: BoardThemeVariant = {
  chessLightSquare: "#3a3a3a",
  chessDarkSquare: "#121212",
  hatchBase: "#121212",
  hatchLine: "rgba(255,255,255,0.17)",
  hatchOnLightChessSquares: false,
  boardBackground: "#1a1a1a",
  frameBackground: "rgba(24, 24, 26, 0.92)",
  frameBorder: "rgba(240, 240, 248, 0.12)",
  coordColor: "rgba(215, 218, 225, 0.72)",
};

export const BOARD_STYLE_MAP: Record<BoardStyleId, BoardStyleDefinition> = {
  classic: {
    kind: "solid-checker",
    id: "classic",
    label: "Classic",
    description: "Soft lilac squares in light mode; deep violet in dark mode",
    lightSquare: CLASSIC_APP_LIGHT.lightSquare,
    darkSquare: CLASSIC_APP_LIGHT.darkSquare,
    variants: {
      light: { ...CLASSIC_APP_LIGHT },
      dark: { ...CLASSIC_APP_DARK },
    },
  },
  blueprint: {
    kind: "blueprint-grid",
    id: "blueprint",
    label: "Blueprint",
    description:
      "Diagonal hatching on the darker squares; colors follow light/dark mode",
    lightSquare: BLUEPRINT_APP_LIGHT.chessLightSquare,
    darkSquare: BLUEPRINT_APP_LIGHT.chessDarkSquare,
    variants: {
      light: BLUEPRINT_APP_LIGHT,
      dark: BLUEPRINT_APP_DARK,
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
  boardStyleId: BoardStyleId;
  coordColor?: string;
  lightSquareStyle: CSSProperties;
  darkSquareStyle: CSSProperties;
  boardStyle?: CSSProperties;
  frame: { backgroundColor: string; borderColor: string } | null;
  cgBoardAppearance: Pick<
    CSSProperties,
    "backgroundColor" | "backgroundImage" | "backgroundSize"
  > | null;
}

export function resolveBoardChessStyles(
  id: BoardStyleId,
  opts?: { colorScheme?: AppColorScheme }
): ResolvedBoardChessStyles {
  const scheme = opts?.colorScheme ?? "light";
  const def = BOARD_STYLE_MAP[id];

  if (def.kind === "solid-checker") {
    const v = def.variants[scheme];
    return {
      boardStyleId: def.id,
      coordColor: v.coordColor,
      lightSquareStyle: { backgroundColor: v.lightSquare },
      darkSquareStyle: { backgroundColor: v.darkSquare },
      boardStyle: { backgroundColor: v.boardBackground },
      frame: {
        backgroundColor: v.frameBackground,
        borderColor: v.frameBorder,
      },
      cgBoardAppearance: {
        backgroundColor: v.lightSquare,
        backgroundImage: svgSolidCheckerboardUrl(v.lightSquare, v.darkSquare),
        backgroundSize: "100% 100%",
      },
    };
  }

  const v = def.variants[scheme];
  const hatchPreviewLine =
    scheme === "light"
      ? "rgba(40,45,55,0.18)"
      : "rgba(255,255,255,0.17)";

  const lightSqPreview: CSSProperties = v.hatchOnLightChessSquares
    ? {
        backgroundColor: v.hatchBase,
        backgroundImage: `repeating-linear-gradient(135deg, transparent 0px, transparent 5px, ${hatchPreviewLine} 5px, ${hatchPreviewLine} 6px)`,
      }
    : { backgroundColor: v.chessLightSquare };

  const darkSqPreview: CSSProperties = !v.hatchOnLightChessSquares
    ? {
        backgroundColor: v.hatchBase,
        backgroundImage: `repeating-linear-gradient(135deg, transparent 0px, transparent 5px, ${hatchPreviewLine} 5px, ${hatchPreviewLine} 6px)`,
      }
    : { backgroundColor: v.chessDarkSquare };

  return {
    boardStyleId: def.id,
    coordColor: v.coordColor,
    lightSquareStyle: lightSqPreview,
    darkSquareStyle: darkSqPreview,
    boardStyle: { backgroundColor: v.boardBackground },
    frame: {
      backgroundColor: v.frameBackground,
      borderColor: v.frameBorder,
    },
    cgBoardAppearance: {
      backgroundColor: v.chessLightSquare,
      backgroundImage: svgBlueprintBoardUrl(v),
      backgroundSize: "100% 100%",
    },
  };
}

export function getBoardStylePreviewCellStyles(
  def: BoardStyleDefinition,
  scheme: AppColorScheme = "light"
): {
  light: CSSProperties;
  dark: CSSProperties;
} {
  if (def.kind === "solid-checker") {
    const v = def.variants[scheme];
    return {
      light: { backgroundColor: v.lightSquare },
      dark: { backgroundColor: v.darkSquare },
    };
  }
  const v = def.variants[scheme];
  const hatchPreviewLine =
    scheme === "light"
      ? "rgba(40,45,55,0.18)"
      : "rgba(255,255,255,0.17)";
  return {
    light: v.hatchOnLightChessSquares
      ? {
          backgroundColor: v.hatchBase,
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0px, transparent 5px, ${hatchPreviewLine} 5px, ${hatchPreviewLine} 6px)`,
        }
      : { backgroundColor: v.chessLightSquare },
    dark: !v.hatchOnLightChessSquares
      ? {
          backgroundColor: v.hatchBase,
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0px, transparent 5px, ${hatchPreviewLine} 5px, ${hatchPreviewLine} 6px)`,
        }
      : { backgroundColor: v.chessDarkSquare },
  };
}
