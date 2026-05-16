import type * as React from "react";
import type { Key } from "chessground/types";
import { key2pos } from "chessground/util";

const SQUARE_KEY = /^[a-h][1-8]$/;

export type BoardHighlightKind = "empty" | "piece" | "focus";

export interface BoardHighlight {
  square: string;
  kind: BoardHighlightKind;
}

/** Normalize and validate square; returns null if invalid. */
export function normalizeHighlightSquare(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  return SQUARE_KEY.test(s) ? s : null;
}

export function normalizeBoardHighlights(
  highlights: readonly BoardHighlight[] | undefined
): BoardHighlight[] {
  if (!highlights?.length) return [];
  const bySquare = new Map<string, BoardHighlight>();
  for (const h of highlights) {
    const sq = normalizeHighlightSquare(h.square);
    if (sq) bySquare.set(sq, { square: sq, kind: h.kind });
  }
  return [...bySquare.values()];
}

/** Percent-based placement inside `cg-board` (matches Chessground square geometry). */
export function boardHighlightOverlayPosition(
  square: string,
  orientation: "white" | "black"
): Pick<React.CSSProperties, "left" | "top" | "width" | "height"> {
  const pos = key2pos(square as Key);
  const asWhite = orientation === "white";
  const leftPct = ((asWhite ? pos[0] : 7 - pos[0]) / 8) * 100;
  const topPct = ((asWhite ? 7 - pos[1] : pos[1]) / 8) * 100;
  return {
    left: `${leftPct}%`,
    top: `${topPct}%`,
    width: "12.5%",
    height: "12.5%",
  };
}
