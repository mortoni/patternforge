"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useActiveTraining } from "../hooks/use-active-training";
import { TrainingEmptyState } from "./training-empty-state";
import { TrainingCycleCompleteState } from "./training-cycle-complete-state";
import { TrainingBoardCard } from "./training-board-card";
import { TrainingSidePanel } from "./training-side-panel";
import { TrainingFeedbackPanel } from "./training-feedback-panel";
import type { PuzzleInteractionState } from "./training-side-panel";
import { getHighlightedSquaresFromMove } from "@/lib/chess/move-highlights";
import { submitAttempt, skipPuzzle } from "../services/training-solver.service";

export function TrainingPage() {
  const { state, loading, error, reload } = useActiveTraining();

  const [positionFen, setPositionFen] = React.useState<string | null>(null);
  const [attemptedMoveUci, setAttemptedMoveUci] = React.useState<string | null>(null);
  const [puzzleState, setPuzzleState] = React.useState<PuzzleInteractionState>("idle");
  const [feedbackExpectedMove, setFeedbackExpectedMove] = React.useState<string | undefined>();
  /** When the current puzzle became active (ms); used to compute attempt duration. */
  const attemptStartedAtRef = React.useRef<number>(Date.now());

  /**
   * Local resolved-puzzle snapshot: after a correct/incorrect result we keep
   * showing this exercise and feedback until the user clicks Next Puzzle.
   * Persisted state (cycle/session) is already advanced; Next Puzzle just reloads.
   */

  const readyState =
    state?.status === "ready" ? state : null;
  const baseFen = readyState?.exercise.fen ?? "";
  const displayFen = positionFen ?? baseFen;

  React.useEffect(() => {
    if (readyState) {
      setPositionFen(null);
      setAttemptedMoveUci(null);
      setPuzzleState("idle");
      setFeedbackExpectedMove(undefined);
      attemptStartedAtRef.current = Date.now();
    }
  }, [readyState?.exercise.id]);

  /** Move = submit: when user makes a legal move on the board, evaluate immediately. */
  const handleBoardMove = React.useCallback(
    async (uci: string, newFen: string) => {
      if (!readyState || !readyState.sessionId) return;
      setPositionFen(newFen);
      setAttemptedMoveUci(uci);
      setPuzzleState("checking");
      try {
        const result = await submitAttempt({
          exerciseId: readyState.exercise.id,
          cycleRunId: readyState.cycleRun.id,
          trainingSetId: readyState.trainingSet.id,
          sessionId: readyState.sessionId,
          fen: baseFen,
          expectedFirstMove:
            readyState.exercise.firstMove ??
            readyState.exercise.solutionMoves[0] ??
            "",
          attemptedMoveUci: uci,
          attemptStartedAt: attemptStartedAtRef.current,
        });
        setFeedbackExpectedMove(result.normalizedExpectedMove);
        setPuzzleState(result.isCorrect ? "correct" : "incorrect");
      } catch {
        setPuzzleState("idle");
        setPositionFen(null);
        setAttemptedMoveUci(null);
      }
    },
    [readyState, baseFen]
  );

  const handleSkip = React.useCallback(async () => {
    if (!readyState || !readyState.sessionId) return;
    setPuzzleState("checking");
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
  const resolved = puzzleState === "correct" || puzzleState === "incorrect";
  const correctMoveSquares =
    puzzleState === "incorrect" && feedbackExpectedMove
      ? getHighlightedSquaresFromMove(feedbackExpectedMove)
      : undefined;
  const attemptedMoveSquares =
    puzzleState === "incorrect" && attemptedMoveUci
      ? getHighlightedSquaresFromMove(attemptedMoveUci)
      : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-5">
      <PageHeader title="Training" description={subtitle} />
      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(260px,300px)]">
        <div className="min-w-0 space-y-3">
          <TrainingBoardCard
            fen={displayFen}
            boardOrientation={readyState!.boardOrientation}
            onMove={handleBoardMove}
            disabled={
              puzzleState === "checking" ||
              puzzleState === "correct" ||
              puzzleState === "incorrect"
            }
            correctMoveSquares={correctMoveSquares}
            attemptedMoveSquares={attemptedMoveSquares}
            correctMoveUci={puzzleState === "incorrect" ? feedbackExpectedMove ?? undefined : undefined}
          />
          {resolved && (
            <TrainingFeedbackPanel
              state={puzzleState === "correct" ? "correct" : "incorrect"}
              attemptedMove={attemptedMoveUci ?? undefined}
              expectedMove={feedbackExpectedMove}
            />
          )}
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
            difficulty={readyState!.exercise.difficulty}
            puzzleState={puzzleState}
            onSkipPuzzle={handleSkip}
            onNextPuzzle={handleNextPuzzle}
          />
        </div>
      </div>
    </div>
  );
}
