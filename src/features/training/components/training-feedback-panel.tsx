"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type FeedbackState = "correct" | "incorrect";

export interface TrainingFeedbackPanelProps {
  state: FeedbackState;
  /** User's attempted move (UCI). Omit when skipped or not applicable. */
  attemptedMove?: string;
  /** Correct first move (UCI) to show when incorrect. */
  expectedMove?: string;
  className?: string;
}

/**
 * Compact result panel: correct = positive message; incorrect = instructive with moves.
 * Uses UCI for move display. No icons.
 */
export function TrainingFeedbackPanel({
  state,
  attemptedMove,
  expectedMove,
  className,
}: TrainingFeedbackPanelProps) {
  if (state === "correct") {
    return (
      <div
        className={cn(
          "rounded-lg border px-3 py-2.5 text-sm",
          "border-green-600/30 bg-green-500/10 dark:border-green-500/30 dark:bg-green-500/15",
          className
        )}
      >
        <p className="font-medium text-green-700 dark:text-green-400">Correct!</p>
        <p className="text-green-700/80 dark:text-green-400/80 mt-0.5">Good move.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm",
        "border-red-600/30 bg-red-500/10 dark:border-red-500/30 dark:bg-red-500/15",
        className
      )}
    >
      <p className="font-medium text-red-700 dark:text-red-400">Incorrect</p>
      <div className="mt-1.5 space-y-0.5 text-muted-foreground">
        {attemptedMove != null && attemptedMove !== "" && (
          <p>
            You played: <span className="font-medium text-foreground">{attemptedMove}</span>
          </p>
        )}
        {expectedMove != null && expectedMove !== "" && (
          <p>
            Correct move: <span className="font-medium text-foreground">{expectedMove}</span>
          </p>
        )}
      </div>
    </div>
  );
}
