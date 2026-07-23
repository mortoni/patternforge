"use client";

/**
 * Training — minimal Woodpecker solving surface.
 * Puzzle interaction (moves, skips, pre-moves, timers) lives in
 * `useTrainingPuzzleMachine`; this component owns loading/empty states,
 * session exit, and layout only.
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
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { getsideToMove } from "@/lib/chess/side-to-move";
import { cn } from "@/lib/utils";
import { useActiveTraining } from "../hooks/use-active-training";
import { useCycleCompleteRedirect } from "../hooks/use-cycle-complete-redirect";
import { useTrainingPuzzleMachine } from "../hooks/use-training-puzzle-machine";
import { TrainingEmptyState } from "./training-empty-state";
import { TrainingBoardCard } from "./training-board-card";
import { completeSession } from "@/services/training-session.service";

/**
 * Board column width: use the padded main width (`100%`), not `vw`, so the board
 * does not overflow horizontally on mobile (main uses `p-4`).
 * `self-center` (not stretch) keeps the max-width column centered in wide layouts.
 */
const BOARD_COLUMN_CLASS =
  "w-full min-w-0 max-w-[min(100%,calc(100dvh-14rem),40rem)] self-center";

export function TrainingPage() {
  const router = useRouter();
  const { state, loading, error, reload } = useActiveTraining();

  useCycleCompleteRedirect(state);

  const readyState = state?.status === "ready" ? state : null;

  const {
    phase,
    displayFen,
    turnForLabel,
    boardDisabled,
    preMoveEnabled,
    saveError,
    dismissError,
    handleBoardMove,
    handleQueuePreMove,
    handleSkip,
  } = useTrainingPuzzleMachine({ readyState, reload, router });

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
        <TrainingEmptyState title="Something went wrong" description={error.message} />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">No training state.</p>
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
      <div className="flex min-h-[calc(100dvh-5.5rem)] flex-col md:min-h-[calc(100dvh-4rem)]">
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
                Last cycle: {formatDurationMs(last.totalTimeMs)} · {last.sessionCount}{" "}
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
        <p className="text-sm font-medium text-[var(--foreground)]">Cycle complete</p>
        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Opening your cycle summary…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] flex-col pt-0.5 md:min-h-[calc(100dvh-4rem)] md:pt-0">
      <h1 className="sr-only">Training</h1>
      <header className="mb-3 flex w-full flex-col gap-y-2 text-[11px] leading-snug text-muted-foreground sm:mb-4 sm:text-xs md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-x-2 md:gap-y-1 md:text-right md:text-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 md:contents">
          <span
            className="min-w-0 max-w-full shrink truncate font-medium text-muted-foreground"
            title={readyState!.trainingSet.name}
          >
            {readyState!.trainingSet.name}
          </span>
          <span className="text-muted-foreground" aria-hidden>
            ·
          </span>
          <span className="shrink-0 tabular-nums font-medium text-muted-foreground">
            Cycle {readyState!.cycleRun.cycleNumber}
          </span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 md:contents">
          <span className="hidden text-muted-foreground md:inline" aria-hidden>
            ·
          </span>
          <span className="shrink-0 tabular-nums text-muted-foreground">
            Exercise {readyState!.exerciseIndex + 1} / {readyState!.totalExercises}
          </span>
          <EndSessionDialog onConfirm={handleEndSession} />
          <ThemeToggle className="hidden md:inline-flex" />
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-6 pt-1 sm:gap-8 sm:pt-0">
        <div className={cn("flex flex-col items-stretch gap-1", BOARD_COLUMN_CLASS)}>
          <div className="min-h-[1.75rem]">
            <SideToMoveIndicator sideToMove={turnForLabel} />
          </div>
          <div className="relative w-full min-h-0">
            <TrainingBoardCard
              fen={displayFen}
              positionSyncKey={readyState!.exercise.id}
              boardOrientation={
                // The puzzle's own side, not the live turn: the live turn flips
                // the moment a move is played, which would spin the board
                // mid-puzzle. It also re-inits Chessground while the board is
                // disabled, and Chessground skips binding pointer handlers when
                // it redraws in view-only mode — leaving the board dead.
                readyState?.autoBoardOrientation
                  ? getsideToMove(readyState.exercise.sideToMove)
                  : readyState!.boardOrientation
              }
              onMove={handleBoardMove}
              onPreMove={handleQueuePreMove}
              disabled={boardDisabled}
              preMoveEnabled={preMoveEnabled}
              preMoveSide={readyState!.exercise.sideToMove}
              minimal
              boardContainerClassName="w-full border-border/40 bg-[var(--muted)]/10"
            />
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
              aria-hidden="true"
            >
              {phase === "transitioning" ? (
                <div className="rounded-md bg-black/70 px-4 py-2 text-sm font-medium text-white shadow-sm">
                  Exercise complete
                </div>
              ) : null}
            </div>
          </div>
          <span className="sr-only" aria-live="polite">
            {phase === "transitioning" ? "Exercise complete" : ""}
          </span>
        </div>

        <div className={cn("flex flex-col gap-2", BOARD_COLUMN_CLASS)}>
          {saveError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400"
            >
              <span className="min-w-0 flex-1">{saveError}</span>
              <button
                type="button"
                onClick={dismissError}
                aria-label="Dismiss error"
                className="shrink-0 font-medium underline-offset-2 hover:underline"
              >
                Dismiss
              </button>
            </div>
          ) : null}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={boardDisabled}
              aria-label="Skip this puzzle"
              // Ghost button, so the roomier mobile hit area (44px) costs
              // nothing visually; desktop keeps the original compact size.
              className="h-auto min-h-11 px-3 py-2 text-xs text-muted-foreground sm:min-h-0 sm:px-2 sm:py-1 sm:text-sm"
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
            Your cycle progress is saved. You can resume training later from the dashboard
            or Training Sets.
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
