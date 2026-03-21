"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { sideToMoveColorWord } from "@/lib/chess/side-to-move";
import { cn } from "@/lib/utils";

export type PuzzleInteractionState =
  | "idle"
  | "move-selected"
  | "checking"
  | "correct_so_far"
  | "correct"
  | "incorrect";

export interface TrainingSidePanelProps {
  exerciseIndex: number;
  totalExercises: number;
  trainingSetName: string;
  cycleNumber: number;
  solvedCount: number;
  sideToMove: "w" | "b";
  gameSource?: string;
  /** Current interaction state. */
  puzzleState: PuzzleInteractionState;
  onSkipPuzzle?: () => void;
  onNextPuzzle?: () => void;
  className?: string;
}

export function TrainingSidePanel({
  exerciseIndex,
  totalExercises,
  trainingSetName,
  cycleNumber,
  solvedCount,
  sideToMove,
  gameSource,
  puzzleState,
  onSkipPuzzle,
  onNextPuzzle,
  className,
}: TrainingSidePanelProps) {
  const progressPct =
    totalExercises > 0 ? Math.round((solvedCount / totalExercises) * 100) : 0;
  const resolved = puzzleState === "correct" || puzzleState === "incorrect";
  const isChecking = puzzleState === "checking";
  const isCorrectSoFar = puzzleState === "correct_so_far";

  return (
    <Card className={cn(className)}>
      <CardContent className="pt-6 space-y-5">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            Exercise {exerciseIndex + 1} / {totalExercises}
          </p>
          <p className="text-sm text-muted-foreground">{trainingSetName}</p>
          <p className="text-xs text-muted-foreground">Cycle {cycleNumber}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Progress</p>
          <Progress value={solvedCount} max={totalExercises} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {solvedCount} / {totalExercises} solved
            </span>
            <span>{progressPct}%</span>
          </div>
        </div>

        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Side to move</dt>
            <dd className="font-medium">{sideToMoveColorWord(sideToMove)}</dd>
          </div>
          {gameSource != null && gameSource !== "" && (
            <div>
              <dt className="text-xs text-muted-foreground">Source</dt>
              <dd className="font-medium">{gameSource}</dd>
            </div>
          )}
        </dl>

        <div className="space-y-2 pt-1">
          {!resolved && !isCorrectSoFar && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onSkipPuzzle}
              disabled={isChecking}
            >
              Skip Puzzle
            </Button>
          )}
          {isCorrectSoFar && (
            <p className="text-sm text-muted-foreground">Finish the combination.</p>
          )}
          {resolved && (
            <Button
              variant="default"
              className="w-full"
              onClick={onNextPuzzle}
            >
              Next Puzzle
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
