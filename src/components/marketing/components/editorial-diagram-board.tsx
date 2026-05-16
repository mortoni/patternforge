"use client";

import * as React from "react";
import { useDocumentAppearance } from "@/components/shared/training-preview";
import { TrainingBoardCard } from "@/features/training/components/training-board-card";
import type { AppColorScheme, BoardStyleId } from "@/lib/chess/board-styles";
import type { BoardHighlight } from "@/lib/chess/board-highlight";
import { normalizeBoardHighlights } from "@/lib/chess/board-highlight";
import { cn } from "@/lib/utils";
import { Chess } from "chess.js";

function useValidatedFen(fen: string): string {
  return React.useMemo(() => {
    try {
      new Chess(fen);
      return fen;
    } catch {
      return new Chess().fen();
    }
  }, [fen]);
}

export type EditorialDiagramBoardProps = {
  fen: string;
  /** Premium warm glow overlays (see {@link BoardHighlight}). */
  highlights?: readonly BoardHighlight[];
  boardOrientation?: "white" | "black";
  /** Stable id so Chessground resyncs when position or accents change. */
  positionSyncKey?: string;
  boardStyleId?: BoardStyleId;
  className?: string;
  boardContainerClassName?: string;
  showCoordinates?: boolean;
  /** Passed to {@link TrainingBoardCard} editorial shell (e.g. tighter `rounded-md`). */
  editorialBoardShellClassName?: string;
};

/**
 * Marketing / editorial chess diagram: themed board, optional premium square highlights, non-interactive.
 */
export function EditorialDiagramBoard({
  fen,
  highlights = [],
  boardOrientation = "white",
  positionSyncKey,
  boardStyleId = "blueprint",
  className,
  boardContainerClassName = "aspect-square w-full",
  showCoordinates = false,
  editorialBoardShellClassName,
}: EditorialDiagramBoardProps) {
  const documentAppearance = useDocumentAppearance();
  const previewColorScheme: AppColorScheme =
    documentAppearance === "dark" ? "dark" : "light";
  const validFen = useValidatedFen(fen);
  const normalized = React.useMemo(
    () => normalizeBoardHighlights(highlights),
    [highlights]
  );

  const syncKey =
    positionSyncKey ??
    `editorial-${validFen.split(" ")[0]}-${normalized.map((h) => `${h.square}:${h.kind}`).sort().join(",")}`;

  return (
    <TrainingBoardCard
      fen={validFen}
      positionSyncKey={syncKey}
      boardOrientation={boardOrientation}
      boardStyleId={boardStyleId}
      previewColorScheme={previewColorScheme}
      disabled
      minimal
      showCoordinates={showCoordinates}
      marketingEmbed={false}
      editorialBoard
      editorialHighlights={normalized.length ? normalized : undefined}
      editorialBoardShellClassName={editorialBoardShellClassName}
      boardContainerClassName={boardContainerClassName}
      className={cn("w-full", className)}
    />
  );
}

export type { BoardHighlight, BoardHighlightKind } from "@/lib/chess/board-highlight";
