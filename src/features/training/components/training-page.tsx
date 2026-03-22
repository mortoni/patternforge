"use client";

/**
 * Training — minimal Woodpecker solving surface.
 * Uses the loader, session, submitAttempt/skipPuzzle, and TrainingBoardCard;
 * post-move UX: no feedback panels, no “next” — wrong or solved single-step advances via reload().
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
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
import {
  useSyncPuzzleFromReadyState,
  type TrainingPuzzleUiState,
} from "../hooks/use-sync-puzzle-from-ready-state";
import { useTrainingBoardActions } from "../hooks/use-training-board-actions";
import { TrainingEmptyState } from "./training-empty-state";
import { TrainingBoardCard } from "./training-board-card";
import { completeSession } from "@/services/training-session.service";

/** Shared width for board column + below-board actions (responsive, viewport-aware). */
const BOARD_COLUMN_CLASS =
  "w-[min(92vw,calc(100dvh-15rem))] max-w-[min(100%,40rem)]";

export function TrainingPage() {
  const router = useRouter();
  const { state, loading, error, reload } = useActiveTraining();

  const [positionFen, setPositionFen] = React.useState<string | null>(null);
  const [puzzleState, setPuzzleState] =
    React.useState<TrainingPuzzleUiState>("idle");
  const [currentSolutionIndex, setCurrentSolutionIndex] = React.useState(0);
  const [accumulatedUserMoves, setAccumulatedUserMoves] = React.useState<
    string[]
  >([]);
  /** Seeded by `useSyncPuzzleFromReadyState` when the active puzzle is known. */
  const attemptStartedAtRef = React.useRef(0);
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

  React.useLayoutEffect(() => {
    currentFenRef.current = displayFen;
    currentSolutionIndexRef.current = currentSolutionIndex;
    accumulatedUserMovesRef.current = accumulatedUserMoves;
  }, [displayFen, currentSolutionIndex, accumulatedUserMoves]);

  useSyncPuzzleFromReadyState(readyState, {
    boardMoveInFlightRef,
    autoPlayTimerRef,
    exerciseTransitionTimerRef,
    currentSolutionIndexRef,
    accumulatedUserMovesRef,
    currentFenRef,
    attemptStartedAtRef,
  }, {
    setPositionFen,
    setCurrentSolutionIndex,
    setAccumulatedUserMoves,
    setPuzzleState,
  });

  const { handleBoardMove, handleSkip } = useTrainingBoardActions(
    readyState,
    baseFen,
    puzzleState,
    reload,
    router,
    {
      currentFenRef,
      currentSolutionIndexRef,
      accumulatedUserMovesRef,
      solvingSideRef,
      boardMoveInFlightRef,
      attemptStartedAtRef,
      autoPlayTimerRef,
      exerciseTransitionTimerRef,
    },
    {
      setPositionFen,
      setPuzzleState,
      setCurrentSolutionIndex,
      setAccumulatedUserMoves,
    }
  );

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
  // Set in `handleBoardMove` before `checking`; ref read ties indicator to pre-submit side.
  const turnForLabel =
    puzzleState === "checking"
      ? // eslint-disable-next-line react-hooks/refs -- paired write in move handler before this render
        solvingSideRef.current
      : sideToMoveFromFen;

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
          <div
            className={cn(
              "transition-opacity duration-200",
              puzzleState === "transitioning" &&
                "pointer-events-none opacity-0"
            )}
            aria-hidden={puzzleState === "transitioning"}
          >
            <SideToMoveIndicator sideToMove={turnForLabel} />
          </div>
          <div className="relative w-full">
            <TrainingBoardCard
              fen={displayFen}
              boardOrientation={readyState!.boardOrientation}
              onMove={handleBoardMove}
              disabled={boardDisabled}
              minimal
              boardContainerClassName="w-full border-border/40 bg-[var(--muted)]/10"
            />
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
              aria-hidden="true"
            >
              <div
                className={cn(
                  "rounded-md bg-black/70 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity duration-200",
                  puzzleState === "transitioning" ? "opacity-100" : "opacity-0"
                )}
              >
                Exercise complete
              </div>
            </div>
          </div>
          <span className="sr-only" aria-live="polite">
            {puzzleState === "transitioning" ? "Exercise complete" : ""}
          </span>
        </div>

        <div className={BOARD_COLUMN_CLASS}>
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
