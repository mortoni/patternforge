"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useActiveTraining } from "../hooks/use-active-training";
import { TrainingEmptyState } from "./training-empty-state";
import { TrainingCycleCompleteState } from "./training-cycle-complete-state";
import { TrainingBoardCard } from "./training-board-card";
import { TrainingSidePanel } from "./training-side-panel";
import { TrainingPuzzleStatusPanel } from "./training-puzzle-status-panel";
import type { PuzzleInteractionState } from "./training-side-panel";
import { getHighlightedSquaresFromMove } from "@/lib/chess/move-highlights";
import { toSanFromFen } from "@/lib/chess/move-notation";
import { submitAttempt, skipPuzzle } from "../services/training-solver.service";
import {
  getPuzzleProgress,
  setPuzzleProgress,
  clearPuzzleProgress,
} from "../services/puzzle-progress-storage";

const AUTO_PLAY_DELAY_MS = 500;

export function TrainingPage() {
  const { state, loading, error, reload } = useActiveTraining();

  const [positionFen, setPositionFen] = React.useState<string | null>(null);
  const [attemptedMoveUci, setAttemptedMoveUci] = React.useState<string | null>(null);
  const [puzzleState, setPuzzleState] = React.useState<PuzzleInteractionState>("idle");
  const [feedbackExpectedMove, setFeedbackExpectedMove] = React.useState<string | undefined>();
  /** Multi-move: index of next expected move in solutionMoves (0 = first move). */
  const [currentSolutionIndex, setCurrentSolutionIndex] = React.useState(0);
  /** Multi-move: user moves played this puzzle (UCI) for submitAttempt. */
  const [accumulatedUserMoves, setAccumulatedUserMoves] = React.useState<string[]>([]);
  /** When the current puzzle became active (ms); used to compute attempt duration. */
  const attemptStartedAtRef = React.useRef<number>(Date.now());
  const autoPlayTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Refs updated synchronously on result so a rapid second move uses correct index/FEN (avoids "Incorrect" when user would play opponent's move). */
  const currentSolutionIndexRef = React.useRef(0);
  const accumulatedUserMovesRef = React.useRef<string[]>([]);
  const currentFenRef = React.useRef<string>("");
  const feedbackFenBeforeMoveRef = React.useRef<string | undefined>(undefined);
  /** Side to move before the in-flight attempt (for status copy while `checking`). */
  const solvingSideRef = React.useRef<"w" | "b">("w");

  const readyState = state?.status === "ready" ? state : null;
  const baseFen = readyState?.exercise.fen ?? "";
  const currentFen = positionFen ?? baseFen;
  const displayFen = positionFen ?? baseFen;

  currentFenRef.current = currentFen;
  currentSolutionIndexRef.current = currentSolutionIndex;
  accumulatedUserMovesRef.current = accumulatedUserMoves;

  React.useEffect(() => {
    if (!readyState) return;
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    const progress = getPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
    if (progress && progress.currentSolutionIndex > 0) {
      setPositionFen(progress.currentFen);
      setCurrentSolutionIndex(progress.currentSolutionIndex);
      setAccumulatedUserMoves(progress.accumulatedUserMoves);
      setPuzzleState("idle");
      currentSolutionIndexRef.current = progress.currentSolutionIndex;
      accumulatedUserMovesRef.current = progress.accumulatedUserMoves;
      currentFenRef.current = progress.currentFen;
    } else {
      setPositionFen(null);
      setCurrentSolutionIndex(0);
      setAccumulatedUserMoves([]);
      setPuzzleState("idle");
      currentSolutionIndexRef.current = 0;
      accumulatedUserMovesRef.current = [];
      currentFenRef.current = readyState.exercise.fen ?? "";
    }
    setAttemptedMoveUci(null);
    setFeedbackExpectedMove(undefined);
    feedbackFenBeforeMoveRef.current = undefined;
    attemptStartedAtRef.current = Date.now();
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [readyState?.exercise.id, readyState?.cycleRun.id]);

  const handleBoardMove = React.useCallback(
    async (uci: string, newFen: string) => {
      if (!readyState || !readyState.sessionId) return;
      const fenBefore = currentFenRef.current;
      solvingSideRef.current = (fenBefore.split(" ")[1] === "b" ? "b" : "w") as "w" | "b";
      setPositionFen(newFen);
      setAttemptedMoveUci(uci);
      setPuzzleState("checking");
      const indexToUse = currentSolutionIndexRef.current;
      const accumulatedToUse = [...accumulatedUserMovesRef.current];
      const fenToUse = fenBefore || baseFen;
      try {
        const result = await submitAttempt({
          exerciseId: readyState.exercise.id,
          cycleRunId: readyState.cycleRun.id,
          trainingSetId: readyState.trainingSet.id,
          sessionId: readyState.sessionId,
          fen: fenToUse,
          expectedFirstMove:
            readyState.exercise.firstMove ??
            readyState.exercise.solutionMoves[0] ??
            "",
          attemptedMoveUci: uci,
          attemptStartedAt: attemptStartedAtRef.current,
          solutionMoves: readyState.exercise.solutionMoves,
          sideToMove: readyState.exercise.sideToMove,
          currentSolutionIndex: indexToUse,
          accumulatedUserMoves: accumulatedToUse,
        });
        setFeedbackExpectedMove(result.normalizedExpectedMove);

        if (!result.isCorrect) {
          feedbackFenBeforeMoveRef.current = fenToUse;
          setPuzzleState("incorrect");
          clearPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
          return;
        }

        if (result.puzzleComplete) {
          setPuzzleState("correct");
          clearPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
          return;
        }

        const nextFen = result.nextFen ?? newFen;
        const nextIndex = result.nextSolutionIndex ?? indexToUse + 1;
        const nextAccumulated = [...accumulatedToUse, result.normalizedAttemptedMove];

        currentSolutionIndexRef.current = nextIndex;
        accumulatedUserMovesRef.current = nextAccumulated;
        currentFenRef.current = nextFen;

        setPositionFen(nextFen);
        setAccumulatedUserMoves(nextAccumulated);
        setCurrentSolutionIndex(nextIndex);
        setPuzzleState("correct_so_far");

        const progress = {
          currentFen: nextFen,
          currentSolutionIndex: nextIndex,
          accumulatedUserMoves: nextAccumulated,
        };
        setPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id, progress);

        if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = setTimeout(() => {
          autoPlayTimerRef.current = null;
          setAttemptedMoveUci(null);
          setPuzzleState("idle");
        }, AUTO_PLAY_DELAY_MS);
      } catch {
        setPuzzleState("idle");
        setPositionFen(currentFenRef.current || baseFen);
        setAttemptedMoveUci(null);
      }
    },
    [readyState, baseFen]
  );

  const handleSkip = React.useCallback(async () => {
    if (!readyState || !readyState.sessionId) return;
    setPuzzleState("checking");
    clearPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
    try {
      await skipPuzzle(
        readyState.exercise.id,
        readyState.cycleRun.id,
        readyState.trainingSet.id,
        readyState.sessionId,
        attemptStartedAtRef.current
      );
      reload();
    } catch {
      setPuzzleState(attemptedMoveUci ? "move-selected" : "idle");
    }
  }, [readyState, attemptedMoveUci, reload]);

  /** Next Puzzle: progression already committed on resolve; just reload to show next puzzle. */
  const handleNextPuzzle = React.useCallback(async () => {
    reload();
  }, [reload]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-5 md:px-5">
        <PageHeader title="Training" />
        <div className="flex items-center justify-center rounded-lg border border-border bg-muted/20 p-12">
          <p className="text-sm text-muted-foreground">Loading training…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-5 md:px-5">
        <PageHeader title="Training" />
        <TrainingEmptyState
          title="Something went wrong"
          description={error.message}
        />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-5 md:px-5">
        <PageHeader title="Training" />
        <div className="flex items-center justify-center rounded-lg border border-border bg-muted/20 p-12">
          <p className="text-sm text-muted-foreground">No training state.</p>
        </div>
      </div>
    );
  }

  if (state.status === "no-training-set") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-5 md:px-5">
        <PageHeader title="Training" />
        <TrainingEmptyState
          title="No active training selected"
          description="Choose a training set to begin or continue your practice."
        />
      </div>
    );
  }

  if (state.status === "no-active-cycle") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-5 md:px-5">
        <PageHeader title="Training" />
        <TrainingEmptyState
          title="No active cycle found"
          description="Start a cycle from Training Sets to begin solving puzzles."
        />
      </div>
    );
  }

  if (state.status === "exercise-not-found") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-5 md:px-5">
        <PageHeader title="Training" />
        <TrainingEmptyState
          title="Current exercise not found"
          description="The cycle references an exercise that could not be loaded."
        />
      </div>
    );
  }

  if (state.status === "cycle-complete") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-5 md:px-5">
        <PageHeader title="Training" />
        <TrainingCycleCompleteState
          trainingSetName={state.trainingSetName}
          cycleNumber={state.cycleNumber}
          solvedCount={state.solvedCount}
          totalExercises={state.totalExercises}
        />
      </div>
    );
  }

  const subtitle = `${readyState!.trainingSet.name} · Cycle ${readyState!.cycleRun.cycleNumber}`;

  const correctMoveSquares =
    puzzleState === "incorrect" && feedbackExpectedMove
      ? getHighlightedSquaresFromMove(feedbackExpectedMove)
      : undefined;
  const attemptedMoveSquares =
    puzzleState === "incorrect" && attemptedMoveUci
      ? getHighlightedSquaresFromMove(attemptedMoveUci)
      : undefined;

  const sideToMoveFromFen = (displayFen.split(" ")[1] === "b" ? "b" : "w") as "w" | "b";
  const feedbackFenBeforeMove = feedbackFenBeforeMoveRef.current;
  const attemptedMoveFeedbackText =
    puzzleState === "incorrect" &&
    feedbackFenBeforeMove != null &&
    attemptedMoveUci != null
      ? toSanFromFen(feedbackFenBeforeMove, attemptedMoveUci)
      : attemptedMoveUci ?? undefined;
  const expectedMoveFeedbackText =
    puzzleState === "incorrect" &&
    feedbackFenBeforeMove != null &&
    feedbackExpectedMove != null
      ? toSanFromFen(feedbackFenBeforeMove, feedbackExpectedMove)
      : feedbackExpectedMove;
  const statusTurnSide =
    puzzleState === "checking" ? solvingSideRef.current : sideToMoveFromFen;
  const statusVariant =
    puzzleState === "incorrect"
      ? ("incorrect" as const)
      : puzzleState === "correct"
        ? ("correct" as const)
        : ("turn" as const);

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-5">
      <PageHeader title="Training" description={subtitle} />
      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(260px,300px)]">
        <div className="min-w-0 space-y-3">
          <TrainingPuzzleStatusPanel
            variant={statusVariant}
            sideToMove={statusTurnSide}
            comment={puzzleState === "correct" ? readyState!.exercise.comment : undefined}
            attemptedMove={puzzleState === "incorrect" ? attemptedMoveFeedbackText : undefined}
            expectedMove={puzzleState === "incorrect" ? expectedMoveFeedbackText : undefined}
          />
          <TrainingBoardCard
            fen={displayFen}
            boardOrientation={readyState!.boardOrientation}
            onMove={handleBoardMove}
            disabled={
              puzzleState === "checking" ||
              puzzleState === "correct_so_far" ||
              puzzleState === "correct" ||
              puzzleState === "incorrect"
            }
            correctMoveSquares={correctMoveSquares}
            attemptedMoveSquares={attemptedMoveSquares}
            correctMoveUci={puzzleState === "incorrect" ? feedbackExpectedMove ?? undefined : undefined}
          />
        </div>
        <div>
          <TrainingSidePanel
            exerciseIndex={readyState!.exerciseIndex}
            totalExercises={readyState!.totalExercises}
            trainingSetName={readyState!.trainingSet.name}
            cycleNumber={readyState!.cycleRun.cycleNumber}
            solvedCount={readyState!.cycleRun.solvedCount}
            sideToMove={readyState!.exercise.sideToMove}
            gameSource={readyState!.exercise.gameSource}
            puzzleState={puzzleState}
            onSkipPuzzle={handleSkip}
            onNextPuzzle={handleNextPuzzle}
          />
        </div>
      </div>
    </div>
  );
}
