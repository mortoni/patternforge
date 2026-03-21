"use client";

/**
 * Training — minimal Woodpecker solving surface.
 * Uses the loader, session, submitAttempt/skipPuzzle, and TrainingBoardCard;
 * post-move UX: no feedback panels, no “next” — wrong or solved single-step advances via reload().
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES, cycleSummaryRoute } from "@/lib/constants";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { formatDurationMs } from "@/lib/format-duration";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SideToMoveIndicator } from "@/components/shared/SideToMoveIndicator";
import { parseSideToMoveFromFen } from "@/lib/chess/side-to-move";
import { cn } from "@/lib/utils";
import { useActiveTraining } from "../hooks/use-active-training";
import { useCycleCompleteRedirect } from "../hooks/use-cycle-complete-redirect";
import { TrainingEmptyState } from "./training-empty-state";
import { TrainingBoardCard } from "./training-board-card";
import { submitAttempt, skipPuzzle } from "../services/training-solver.service";
import {
  getPuzzleProgress,
  setPuzzleProgress,
  clearPuzzleProgress,
} from "../services/puzzle-progress-storage";
import { completeSession } from "@/services/training-session.service";

const AUTO_PLAY_DELAY_MS = 500;

/**
 * Pause after an exercise ends (solved or not) so the final position reads clearly
 * before loading the next puzzle — neutral UX, no correct/incorrect messaging.
 */
const EXERCISE_TRANSITION_MS = 1000;

/** Shared width for board column + below-board actions (responsive, viewport-aware). */
const BOARD_COLUMN_CLASS =
  "w-[min(92vw,calc(100dvh-15rem))] max-w-[min(100%,40rem)]";

type V2PuzzleState = "idle" | "checking" | "correct_so_far" | "transitioning";

export function TrainingPageV2() {
  const router = useRouter();
  const { state, loading, error, reload } = useActiveTraining();

  const [positionFen, setPositionFen] = React.useState<string | null>(null);
  const [puzzleState, setPuzzleState] = React.useState<V2PuzzleState>("idle");
  const [currentSolutionIndex, setCurrentSolutionIndex] = React.useState(0);
  const [accumulatedUserMoves, setAccumulatedUserMoves] = React.useState<
    string[]
  >([]);
  const attemptStartedAtRef = React.useRef<number>(Date.now());
  const autoPlayTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const exerciseTransitionTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const currentSolutionIndexRef = React.useRef(0);
  const accumulatedUserMovesRef = React.useRef<string[]>([]);
  const currentFenRef = React.useRef<string>("");
  const solvingSideRef = React.useRef<"w" | "b">("w");
  /**
   * Prevents duplicate submitAttempt / cycle advance when the chessboard fires twice
   * for one gesture (e.g. drop + synthetic click) before React disables interaction.
   */
  const boardMoveInFlightRef = React.useRef(false);

  useCycleCompleteRedirect(state);

  const readyState = state?.status === "ready" ? state : null;
  const baseFen = readyState?.exercise.fen ?? "";
  const displayFen = positionFen ?? baseFen;

  currentFenRef.current = displayFen;
  currentSolutionIndexRef.current = currentSolutionIndex;
  accumulatedUserMovesRef.current = accumulatedUserMoves;

  React.useEffect(() => {
    if (!readyState) return;
    boardMoveInFlightRef.current = false;
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (exerciseTransitionTimerRef.current) {
      clearTimeout(exerciseTransitionTimerRef.current);
      exerciseTransitionTimerRef.current = null;
    }
    const progress = getPuzzleProgress(
      readyState.cycleRun.id,
      readyState.exercise.id
    );
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
    attemptStartedAtRef.current = Date.now();
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      if (exerciseTransitionTimerRef.current) {
        clearTimeout(exerciseTransitionTimerRef.current);
        exerciseTransitionTimerRef.current = null;
      }
    };
  }, [readyState?.exercise.id, readyState?.cycleRun.id]);

  React.useEffect(() => {
    return () => {
      if (exerciseTransitionTimerRef.current) {
        clearTimeout(exerciseTransitionTimerRef.current);
        exerciseTransitionTimerRef.current = null;
      }
    };
  }, []);

  const handleBoardMove = React.useCallback(
    async (uci: string, newFen: string) => {
      if (!readyState || !readyState.sessionId) return;
      if (boardMoveInFlightRef.current) return;
      boardMoveInFlightRef.current = true;
      const fenBefore = currentFenRef.current;
      solvingSideRef.current = parseSideToMoveFromFen(fenBefore);
      setPositionFen(newFen);
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

        if (!result.isCorrect) {
          clearPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
          setPuzzleState("transitioning");
          if (exerciseTransitionTimerRef.current) {
            clearTimeout(exerciseTransitionTimerRef.current);
          }
          const cycleRunId = readyState.cycleRun.id;
          exerciseTransitionTimerRef.current = setTimeout(() => {
            exerciseTransitionTimerRef.current = null;
            if (result.cycleComplete) {
              router.replace(cycleSummaryRoute(cycleRunId));
            } else {
              void reload();
            }
          }, EXERCISE_TRANSITION_MS);
          return;
        }

        if (result.puzzleComplete) {
          clearPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
          setPuzzleState("transitioning");
          if (exerciseTransitionTimerRef.current) {
            clearTimeout(exerciseTransitionTimerRef.current);
          }
          const cycleRunId = readyState.cycleRun.id;
          exerciseTransitionTimerRef.current = setTimeout(() => {
            exerciseTransitionTimerRef.current = null;
            if (result.cycleComplete) {
              router.replace(cycleSummaryRoute(cycleRunId));
            } else {
              void reload();
            }
          }, EXERCISE_TRANSITION_MS);
          return;
        }

        const nextFen = result.nextFen ?? newFen;
        const nextIndex = result.nextSolutionIndex ?? indexToUse + 1;
        const nextAccumulated = [
          ...accumulatedToUse,
          result.normalizedAttemptedMove,
        ];

        currentSolutionIndexRef.current = nextIndex;
        accumulatedUserMovesRef.current = nextAccumulated;
        currentFenRef.current = nextFen;

        setPositionFen(nextFen);
        setAccumulatedUserMoves(nextAccumulated);
        setCurrentSolutionIndex(nextIndex);
        setPuzzleState("correct_so_far");

        setPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id, {
          currentFen: nextFen,
          currentSolutionIndex: nextIndex,
          accumulatedUserMoves: nextAccumulated,
        });

        if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = setTimeout(() => {
          autoPlayTimerRef.current = null;
          setPuzzleState("idle");
        }, AUTO_PLAY_DELAY_MS);
      } catch {
        setPuzzleState("idle");
        setPositionFen(currentFenRef.current || baseFen);
      } finally {
        boardMoveInFlightRef.current = false;
      }
    },
    [readyState, baseFen, reload, router]
  );

  const handleSkip = React.useCallback(async () => {
    if (!readyState || !readyState.sessionId) return;
    if (puzzleState === "checking" || puzzleState === "transitioning") return;
    setPuzzleState("checking");
    clearPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
    try {
      const { cycleComplete } = await skipPuzzle(
        readyState.exercise.id,
        readyState.cycleRun.id,
        readyState.trainingSet.id,
        readyState.sessionId,
        attemptStartedAtRef.current
      );
      if (cycleComplete) {
        router.replace(cycleSummaryRoute(readyState.cycleRun.id));
      } else {
        await reload();
      }
    } catch {
      setPuzzleState("idle");
    }
  }, [readyState, puzzleState, reload, router]);

  const handleEndSession = React.useCallback(async () => {
    const sid = readyState?.sessionId;
    if (sid) {
      await completeSession(sid);
      router.push(
        `${ROUTES.trainingSessionSummary}?sessionId=${encodeURIComponent(sid)}`
      );
    } else {
      // Session should exist in ready state; fallback avoids a dead-end.
      router.push(ROUTES.app);
    }
  }, [readyState?.sessionId, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <TrainingEmptyState
          title="Something went wrong"
          description={error.message}
        />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          No training state.
        </p>
      </div>
    );
  }

  if (state.status === "no-training-set") {
    return (
      <div className="mx-auto max-w-lg py-8">
        <TrainingEmptyState
          title="No active training selected"
          description="Choose a training set to begin or continue your practice."
        />
      </div>
    );
  }

  if (state.status === "no-active-cycle") {
    const last = state.lastCompletedCycle;
    return (
      <div className="flex min-h-[calc(100dvh-6rem)] flex-col md:min-h-[calc(100dvh-4rem)]">
        <h1 className="sr-only">Training</h1>
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-md text-center">
            <EmptyState
              title="No active cycle"
              description="Start a new cycle to begin training."
              className="border-solid bg-muted/10"
            >
              <div className="flex w-full flex-col items-stretch gap-2 sm:items-center">
                <Button asChild variant="default" className="w-full sm:w-auto">
                  <Link href={ROUTES.sets}>Start new cycle</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full text-muted-foreground sm:w-auto"
                >
                  <Link href={ROUTES.progress}>View previous cycles</Link>
                </Button>
              </div>
            </EmptyState>
            {last != null ? (
              <p className="mt-6 text-xs tabular-nums text-muted-foreground/70">
                Last cycle: {formatDurationMs(last.totalTimeMs)} ·{" "}
                {last.sessionCount}{" "}
                {last.sessionCount === 1 ? "session" : "sessions"}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "exercise-not-found") {
    return (
      <div className="mx-auto max-w-lg py-8">
        <TrainingEmptyState
          title="Current exercise not found"
          description="The cycle references an exercise that could not be loaded."
        />
      </div>
    );
  }

  if (state.status === "cycle-complete") {
    return (
      <div className="flex min-h-[45vh] flex-col items-center justify-center gap-2 px-4">
        <p className="text-sm font-medium text-[var(--foreground)]">
          Cycle complete
        </p>
        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Opening your cycle summary…
        </p>
      </div>
    );
  }

  const sideToMoveFromFen = parseSideToMoveFromFen(displayFen);
  const turnForLabel =
    puzzleState === "checking" ? solvingSideRef.current : sideToMoveFromFen;

  const boardDisabled =
    puzzleState === "checking" ||
    puzzleState === "correct_so_far" ||
    puzzleState === "transitioning";

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col md:min-h-[calc(100dvh-4rem)]">
      <h1 className="sr-only">Training</h1>
      <header className="mb-4 flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-xs text-[var(--muted-foreground)] sm:mb-5 sm:text-sm">
        <span
          className="max-w-[42ch] truncate text-xs font-medium text-[var(--muted-foreground)] sm:text-sm"
          title={`${readyState!.trainingSet.name} · Cycle ${readyState!.cycleRun.cycleNumber}`}
        >
          {readyState!.trainingSet.name} · Cycle {readyState!.cycleRun.cycleNumber}
        </span>
        <span className="tabular-nums">
          Exercise {readyState!.exerciseIndex + 1} /{" "}
          {readyState!.totalExercises}
        </span>
        <EndSessionDialog onConfirm={handleEndSession} />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 pb-6">
        <div
          className={cn(
            "flex flex-col items-stretch gap-1",
            BOARD_COLUMN_CLASS
          )}
        >
          {puzzleState !== "transitioning" && (
            <SideToMoveIndicator sideToMove={turnForLabel} />
          )}
          <TrainingBoardCard
            fen={displayFen}
            boardOrientation={readyState!.boardOrientation}
            onMove={handleBoardMove}
            disabled={boardDisabled}
            minimal
            boardContainerClassName="w-full border-border/40 bg-[var(--muted)]/10"
          />
        </div>

        <div className={cn("space-y-5", BOARD_COLUMN_CLASS)}>
          {puzzleState === "transitioning" && (
            <p
              className="text-sm text-[var(--muted-foreground)]"
              aria-live="polite"
            >
              Exercise complete
            </p>
          )}

          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={boardDisabled}
              aria-label="Skip this puzzle"
              className="h-auto px-2 py-1 text-xs text-muted-foreground sm:text-sm"
            >
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EndSessionDialog({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-2 py-1 text-xs text-muted-foreground sm:text-sm"
        >
          End session
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End this session?</AlertDialogTitle>
          <AlertDialogDescription>
            Your cycle progress is saved. You can resume training later from the
            dashboard or Training Sets.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>End session</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
