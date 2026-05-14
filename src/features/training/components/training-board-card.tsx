"use client";

/**
 * Training board shell: layout + styling around {@link PatternBoard} (Chessground).
 */

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useBoardStyle } from "@/features/settings/hooks/use-board-style";
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
   * `w-[min(92vw,calc(100dvh-14rem))]` so the board fits the viewport with header/footer.
   */
  boardContainerClassName?: string;
  /** Bumps Chessground sync without full remount; use stable exercise/review ids. */
  positionSyncKey?: string;
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
}: TrainingBoardCardProps) {
  const surface = useBoardStyle();

  const frame = surface.frame;
  const boardShell = (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-md border",
        boardContainerClassName ??
          "w-full max-w-[min(100%,42rem)]",
        !frame && "border-border bg-muted/30",
        minimal && !frame && "rounded-sm border-border/50 bg-muted/20",
        minimal && frame && "rounded-sm",
        !minimal && frame && "rounded-md"
      )}
      style={
        frame
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
