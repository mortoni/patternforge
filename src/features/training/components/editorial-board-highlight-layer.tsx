"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  boardHighlightOverlayPosition,
  normalizeBoardHighlights,
  type BoardHighlight,
} from "@/lib/chess/board-highlight";

export function EditorialBoardHighlightCells({
  highlights,
  orientation,
}: {
  highlights: readonly BoardHighlight[];
  orientation: "white" | "black";
}) {
  const prefersReducedMotion = useReducedMotion();
  const items = React.useMemo(
    () => normalizeBoardHighlights(highlights),
    [highlights]
  );

  return (
    <>
      {items.map((h) => (
        <div
          key={h.square}
          className={cn(
            "pf-cg-editorial-hl-cell pointer-events-none absolute box-border",
            h.kind === "empty" && "pf-cg-editorial-hl-cell--empty",
            h.kind === "piece" && "pf-cg-editorial-hl-cell--piece",
            h.kind === "focus" && [
              "pf-cg-editorial-hl-cell--focus",
              !prefersReducedMotion && "pf-cg-editorial-hl-cell--focus-pulse",
            ]
          )}
          style={boardHighlightOverlayPosition(h.square, orientation)}
          aria-hidden
        />
      ))}
    </>
  );
}
