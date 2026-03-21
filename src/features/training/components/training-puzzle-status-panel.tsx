"use client";

import * as React from "react";
import { normalizeChessNotation } from "@/lib/chess/normalize-chess-notation";
import { cn } from "@/lib/utils";

export type TrainingPuzzleStatusVariant = "turn" | "correct" | "incorrect";

export interface TrainingPuzzleStatusPanelProps {
  variant: TrainingPuzzleStatusVariant;
  /** Side to move (from current display FEN) when variant is "turn". */
  sideToMove: "w" | "b";
  /** Shown as subtitle when variant is "correct" (trimmed); omitted when empty. */
  comment?: string;
  attemptedMove?: string;
  expectedMove?: string;
  className?: string;
}

const PANEL_MIN_H = "min-h-[4.75rem]";

/**
 * Single status strip above the training board: your turn, checking, correct, or incorrect.
 */
export function TrainingPuzzleStatusPanel({
  variant,
  sideToMove,
  comment,
  attemptedMove,
  expectedMove,
  className,
}: TrainingPuzzleStatusPanelProps) {
  const commentTrimmed =
    comment != null && comment.trim() !== ""
      ? normalizeChessNotation(comment.trim())
      : undefined;

  if (variant === "turn") {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm",
          PANEL_MIN_H,
          className
        )}
        data-active-side={sideToMove}
        aria-label="Your turn"
      >
        <p className="font-medium text-foreground">Your turn</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Find the best continuation.
        </p>
      </div>
    );
  }

  if (variant === "correct") {
    return (
      <div
        className={cn(
          "rounded-lg border px-3 py-2.5 text-sm flex items-center gap-3",
          PANEL_MIN_H,
          "border-green-600/30 bg-green-500/10 dark:border-green-500/30 dark:bg-green-500/15",
          className
        )}
        aria-live="polite"
      >
        <span className="w-8 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-green-700 dark:text-green-400">Correct!</p>
          {commentTrimmed != null && (
            <p className="text-green-700/80 dark:text-green-400/80 text-xs mt-0.5">
              {commentTrimmed}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm flex items-start gap-3",
        PANEL_MIN_H,
        "border-red-600/30 bg-red-500/10 dark:border-red-500/30 dark:bg-red-500/15",
        className
      )}
      aria-live="polite"
    >
      <span className="w-8 shrink-0 pt-0.5" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-red-700 dark:text-red-400">Incorrect</p>
        <div className="mt-1.5 space-y-0.5 text-muted-foreground text-xs">
          {attemptedMove != null && attemptedMove !== "" && (
            <p>
              You played:{" "}
              <span className="font-medium text-foreground">{attemptedMove}</span>
            </p>
          )}
          {expectedMove != null && expectedMove !== "" && (
            <p>
              Correct move:{" "}
              <span className="font-medium text-foreground">{expectedMove}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
