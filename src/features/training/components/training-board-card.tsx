"use client";

/**
 * Training board shell: layout + styling around {@link PatternBoard} (Chessground).
 */

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffectiveAppColorScheme } from "@/features/settings/hooks/use-effective-app-color-scheme";
import { useBoardStyle } from "@/features/settings/hooks/use-board-style";
import {
  parseBoardStyleId,
  type AppColorScheme,
  type BoardStyleId,
  resolveBoardChessStyles,
} from "@/lib/chess/board-styles";
import { PatternBoard } from "./pattern-board";

export interface TrainingBoardCardProps {
  /** Current position FEN (controlled). Updates after user makes a move. */
  fen: string;
  boardOrientation: "white" | "black";
  /** Called when user makes a legal move. Receives UCI and new FEN so parent can update. */
  onMove?: (uci: string, newFen: string) => void;
  /**
   * Optional single pre-move queue callback used while board is otherwise locked.
   * Parent owns queue semantics and execution timing.
   */
  onPreMove?: (uci: string) => void;
  /** When true, board is not interactive (e.g. after puzzle resolved). */
  disabled?: boolean;
  /**
   * When true, allow dragging/queuing one pre-move even if `disabled` is true.
   * Only pieces matching `preMoveSide` are draggable.
   */
  preMoveEnabled?: boolean;
  preMoveSide?: "w" | "b";
  /** Square ids to highlight as the correct move (e.g. after incorrect result). */
  correctMoveSquares?: string[];
  /** Optional: square ids for the user's attempted move (subtle different style). */
  attemptedMoveSquares?: string[];
  /** UCI of the correct move when showing incorrect feedback; used to draw arrow. */
  correctMoveUci?: string;
  className?: string;
  /**
   * When true, omit the Card wrapper for a quieter layout (e.g. Training page).
   * Board interaction logic is unchanged.
   */
  minimal?: boolean;
  /**
   * Classes for the square board container (aspect-square). Use for responsive sizing, e.g.
   * Parent should set width (e.g. `w-full max-w-[min(100%,calc(100dvh-14rem))]`) for responsive fit.
   */
  boardContainerClassName?: string;
  /** Bumps Chessground sync without full remount; use stable exercise/review ids. */
  positionSyncKey?: string;
  /**
   * When set (e.g. marketing iframe preview), overrides persisted board style without
   * changing settings.
   */
  boardStyleId?: BoardStyleId;
  /**
   * When set with {@link boardStyleId}, fixes palette resolution for SSR/hydration
   * (ignores `system` / `matchMedia` until effects run).
   */
  previewColorScheme?: AppColorScheme;
  /** When false, hides a–h / 1–8 on the board (marketing previews keep UI quiet). */
  showCoordinates?: boolean;
  /** Landing iframe previews: thinner black-piece outline in dark mode (see PatternBoard CSS). */
  marketingEmbed?: boolean;
  /** Marketing editorial diagrams: glass shell, no frame chrome; enables PatternBoard editorial styling. */
  editorialBoard?: boolean;
  editorialAccentSquares?: string[];
}

export function TrainingBoardCard({
  fen,
  boardOrientation,
  positionSyncKey,
  onMove,
  onPreMove,
  disabled = false,
  preMoveEnabled = false,
  preMoveSide,
  correctMoveSquares,
  attemptedMoveSquares,
  correctMoveUci,
  className,
  minimal = false,
  boardContainerClassName,
  boardStyleId,
  previewColorScheme,
  showCoordinates = true,
  marketingEmbed = false,
  editorialBoard = false,
  editorialAccentSquares,
}: TrainingBoardCardProps) {
  const effectiveScheme = useEffectiveAppColorScheme();
  const colorScheme = previewColorScheme ?? effectiveScheme;
  const surfaceFromSettings = useBoardStyle();
  const surface = React.useMemo(() => {
    if (boardStyleId != null) {
      return resolveBoardChessStyles(parseBoardStyleId(boardStyleId), {
        colorScheme,
      });
    }
    return surfaceFromSettings;
  }, [boardStyleId, colorScheme, surfaceFromSettings]);

  const frame = surface.frame;
  const boardShell = (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-md border",
        boardContainerClassName ??
          "w-full max-w-[min(100%,42rem)]",
        editorialBoard &&
          "rounded-xl border-0 bg-gradient-to-b from-white/[0.03] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:from-white/[0.035] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        !editorialBoard && !frame && "border-border bg-muted/30",
        !editorialBoard && minimal && !frame && "rounded-sm border-border/50 bg-muted/20",
        !editorialBoard && minimal && frame && "rounded-sm",
        !editorialBoard && !minimal && frame && "rounded-md"
      )}
      style={
        editorialBoard
          ? undefined
          : frame
            ? {
                backgroundColor: frame.backgroundColor,
                borderColor: frame.borderColor,
              }
            : undefined
      }
    >
      <div className="h-full w-full min-h-0">
        <PatternBoard
          fen={fen}
          boardOrientation={boardOrientation}
          positionSyncKey={positionSyncKey}
          onMove={onMove}
          onPreMove={onPreMove}
          disabled={disabled}
          preMoveEnabled={preMoveEnabled}
          preMoveSide={preMoveSide}
          correctMoveSquares={correctMoveSquares}
          attemptedMoveSquares={attemptedMoveSquares}
          correctMoveUci={correctMoveUci}
          surface={surface}
          showCoordinates={showCoordinates}
          marketingEmbed={marketingEmbed}
          editorialBoard={editorialBoard}
          editorialAccentSquares={editorialAccentSquares}
        />
      </div>
    </div>
  );

  if (minimal) {
    return (
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center",
          className
        )}
      >
        {boardShell}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border border-border bg-card",
        className
      )}
    >
      <CardContent className="flex flex-col items-center p-4 md:p-6">
        {boardShell}
      </CardContent>
    </Card>
  );
}
