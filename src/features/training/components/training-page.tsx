"use client";

/**
 * Training — minimal Woodpecker solving surface.
 * Uses the loader, session, submitAttempt/skipPuzzle, and TrainingBoardCard;
 * post-move UX: no feedback panels, no “next” — wrong or solved single-step advances via silent reload().
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
import { getsideToMove, parseSideToMoveFromFen } from "@/lib/chess/side-to-move";
import { Chess } from "chess.js";
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

/**
 * Board column width: use the padded main width (`100%`), not `vw`, so the board
 * does not overflow horizontally on mobile (main uses `p-4`).
 */
const BOARD_COLUMN_CLASS =
  "w-full min-w-0 max-w-[min(100%,calc(100dvh-14rem),40rem)] self-stretch";

function parseUciForExecution(
  uci: string
): { from: string; to: string; promotion?: string } | null {
  const t = uci.trim().toLowerCase();
  if (t.length === 4) return { from: t.slice(0, 2), to: t.slice(2, 4) };
  if (t.length === 5 && /^[a-h][1-8][a-h][1-8][qnrb]$/.test(t)) {
    return { from: t.slice(0, 2), to: t.slice(2, 4), promotion: t[4] };
  }
  return null;
}

export function TrainingPage() {
  const router = useRouter();
  const { state, loading, error, reload } = useActiveTraining();

  const [positionFen, setPositionFen] = React.useState<string | null>(null);
  const [puzzleState, setPuzzleState] = React.useState<TrainingPuzzleUiState>("idle");
  const [currentSolutionIndex, setCurrentSolutionIndex] = React.useState(0);
  const [accumulatedUserMoves, setAccumulatedUserMoves] = React.useState<string[]>([]);
  /** Seeded by `useSyncPuzzleFromReadyState` when the active puzzle is known. */
  const attemptStartedAtRef = React.useRef(0);
  const autoPlayTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponentRevealTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const exerciseTransitionTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const currentSolutionIndexRef = React.useRef(0);
  const accumulatedUserMovesRef = React.useRef<string[]>([]);
  const currentFenRef = React.useRef<string>("");
  const solvingSideRef = React.useRef<"w" | "b">("w");
  /**
   * Prevents duplicate submitAttempt / cycle advance when the chessboard fires twice
   * for one gesture (e.g. drop + synthetic click) before React disables interaction.
   */
  const boardMoveInFlightRef = React.useRef(false);
  const queuedPreMoveUciRef = React.useRef<string | null>(null);

  useCycleCompleteRedirect(state);

  const readyState = state?.status === "ready" ? state : null;
  const baseFen = readyState?.exercise.fen ?? "";
  const displayFen = positionFen ?? baseFen;

  React.useLayoutEffect(() => {
    currentFenRef.current = displayFen;
    currentSolutionIndexRef.current = currentSolutionIndex;
    accumulatedUserMovesRef.current = accumulatedUserMoves;
  }, [displayFen, currentSolutionIndex, accumulatedUserMoves]);

  useSyncPuzzleFromReadyState(
    readyState,
    {
      boardMoveInFlightRef,
      autoPlayTimerRef,
      opponentRevealTimerRef,
      exerciseTransitionTimerRef,
      currentSolutionIndexRef,
      accumulatedUserMovesRef,
      currentFenRef,
      attemptStartedAtRef,
    },
    {
      setPositionFen,
      setCurrentSolutionIndex,
      setAccumulatedUserMoves,
      setPuzzleState,
    }
  );

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
      opponentRevealTimerRef,
      exerciseTransitionTimerRef,
    },
    {
      setPositionFen,
      setPuzzleState,
      setCurrentSolutionIndex,
      setAccumulatedUserMoves,
    }
  );

  React.useEffect(() => {
    queuedPreMoveUciRef.current = null;
  }, [readyState?.cycleRun.id, readyState?.exercise.id]);

  const handleQueuePreMove = React.useCallback((uci: string) => {
    if (!readyState || puzzleState !== "checking") return;
    queuedPreMoveUciRef.current = uci;
  }, [readyState, puzzleState]);

  /**
   * Execute one queued pre-move as soon as the board returns to the trainee side.
   * Invalid queued moves are silently discarded.
   */
  React.useEffect(() => {
    const queued = queuedPreMoveUciRef.current;
    if (!readyState || !queued) return;
    if (puzzleState === "checking" || puzzleState === "transitioning") return;
    if (boardMoveInFlightRef.current) return;
    const sideToMove = parseSideToMoveFromFen(displayFen);
    if (sideToMove !== readyState.exercise.sideToMove) return;
    try {
      const chess = new Chess(displayFen);
      const parsed = parseUciForExecution(queued);
      const made = parsed ? chess.move(parsed) : chess.move(queued);
      queuedPreMoveUciRef.current = null;
      if (!made) return;
      const m = made as { from: string; to: string; promotion?: string };
      const normalizedUci = `${m.from}${m.to}${m.promotion ?? ""}`;
      void handleBoardMove(normalizedUci, chess.fen());
    } catch {
      queuedPreMoveUciRef.current = null;
    }
  }, [readyState, puzzleState, displayFen, handleBoardMove]);

  const handleSkipWithPreMoveReset = React.useCallback(async () => {
    queuedPreMoveUciRef.current = null;
    await handleSkip();
  }, [handleSkip]);

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
                readyState?.autoBoardOrientation
                  ? getsideToMove(turnForLabel)
                  : readyState!.boardOrientation
              }
              onMove={handleBoardMove}
              onPreMove={handleQueuePreMove}
              disabled={boardDisabled}
              preMoveEnabled={puzzleState === "checking"}
              preMoveSide={readyState!.exercise.sideToMove}
              minimal
              boardContainerClassName="w-full border-border/40 bg-[var(--muted)]/10"
            />
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
              aria-hidden="true"
            >
              {puzzleState === "transitioning" ? (
                <div className="rounded-md bg-black/70 px-4 py-2 text-sm font-medium text-white shadow-sm">
                  Exercise complete
                </div>
              ) : null}
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
              onClick={handleSkipWithPreMoveReset}
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
