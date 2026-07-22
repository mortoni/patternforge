"use client";

/**
 * Training puzzle state machine.
 *
 * Replaces the previous ref-bag (mirror refs + three hand-cleared timer refs +
 * a double-fire guard spread across two hooks) with:
 *  - one `useReducer` holding the whole puzzle UI state, and
 *  - one timer-owning effect that maps the current phase to its timed follow-up.
 *
 * Phases (the old code collapsed the first three into a single "checking",
 * which is why its timers had to be tracked by hand):
 *   idle              — awaiting the trainee's move (only interactive phase)
 *   checking          — a submitted move is being persisted/evaluated
 *   revealingOpponent — correct partial line; the trainee's move is shown while
 *                        the opponent's auto-reply is briefly withheld
 *   correctSoFar      — partial line applied; a short lock before unlocking
 *   resolving         — puzzle ended (wrong or fully solved); short hold so the
 *                        last move finishes animating before the overlay
 *   transitioning     — "Exercise complete" overlay, then reload / redirect
 */

import * as React from "react";
import type { useRouter } from "next/navigation";
import { Chess } from "chess.js";
import { cycleSummaryRoute } from "@/lib/constants";
import { parseSideToMoveFromFen } from "@/lib/chess/side-to-move";
import { submitAttempt, skipPuzzle } from "../services/training-solver.service";
import {
  getPuzzleProgress,
  setPuzzleProgress,
  clearPuzzleProgress,
} from "../services/puzzle-progress-storage";
import { notifyPuzzleActivated } from "@/services/training-puzzle-lifecycle.service";
import type { ActiveTrainingState } from "../types";
import type { ReloadTrainingOptions } from "./use-active-training";
import {
  EXERCISE_TRANSITION_MS,
  OPPONENT_REPLY_TOTAL_DELAY_MS,
  POST_CORRECT_IDLE_DELAY_MS,
  PUZZLE_RESOLVE_UI_DELAY_MS,
} from "../training-board-timing";

export type ReadyTrainingState = Extract<ActiveTrainingState, { status: "ready" }>;

export type TrainingPuzzlePhase =
  | "idle"
  | "checking"
  | "revealingOpponent"
  | "correctSoFar"
  | "resolving"
  | "transitioning";

/**
 * Shown when persisting an attempt/skip throws (e.g. IndexedDB write blocked by
 * private-browsing or storage quota). The move is rolled back to the pre-attempt
 * position so the trainee can retry rather than silently losing the move.
 */
export const MOVE_SAVE_ERROR_MESSAGE =
  "Couldn't save your move — it wasn't recorded. This can happen in private browsing or when storage is full. Try again.";
export const SKIP_SAVE_ERROR_MESSAGE = "Couldn't skip this puzzle — try again.";

interface LineProgress {
  positionFen: string;
  solutionIndex: number;
  accumulatedUserMoves: string[];
}

interface PuzzleState {
  phase: TrainingPuzzlePhase;
  /** null → render the exercise's start FEN. */
  positionFen: string | null;
  solutionIndex: number;
  accumulatedUserMoves: string[];
  /** Side to move at submit time; drives the indicator while resolving. */
  solvingSide: "w" | "b";
  error: string | null;
  /** Line progress to apply when the opponent reveal timer fires. */
  pendingReveal: LineProgress | null;
  /** How to leave the exercise once the transition timer fires. */
  exit: { cycleRunId: string; cycleComplete: boolean } | null;
}

type PuzzleAction =
  | { type: "restore"; positionFen: string | null; solutionIndex: number; accumulatedUserMoves: string[] }
  | { type: "moveSubmitted"; positionFen: string; solvingSide: "w" | "b" }
  | { type: "skipStarted" }
  | { type: "resolved"; exit: { cycleRunId: string; cycleComplete: boolean } }
  | { type: "showTransition" }
  | { type: "awaitOpponentReveal"; pendingReveal: LineProgress }
  | { type: "opponentRevealed" }
  | { type: "lineAdvanced"; progress: LineProgress }
  | { type: "idleElapsed" }
  | { type: "saveFailed"; positionFen: string | null; message: string }
  | { type: "dismissError" };

const INITIAL_STATE: PuzzleState = {
  phase: "idle",
  positionFen: null,
  solutionIndex: 0,
  accumulatedUserMoves: [],
  solvingSide: "w",
  error: null,
  pendingReveal: null,
  exit: null,
};

function reducer(state: PuzzleState, action: PuzzleAction): PuzzleState {
  switch (action.type) {
    case "restore":
      return {
        ...INITIAL_STATE,
        solvingSide: state.solvingSide,
        positionFen: action.positionFen,
        solutionIndex: action.solutionIndex,
        accumulatedUserMoves: action.accumulatedUserMoves,
      };
    case "moveSubmitted":
      return {
        ...state,
        phase: "checking",
        positionFen: action.positionFen,
        solvingSide: action.solvingSide,
        error: null,
        pendingReveal: null,
        exit: null,
      };
    case "skipStarted":
      return { ...state, phase: "checking", error: null };
    case "resolved":
      return { ...state, phase: "resolving", exit: action.exit };
    case "showTransition":
      return { ...state, phase: "transitioning" };
    case "awaitOpponentReveal":
      return { ...state, phase: "revealingOpponent", pendingReveal: action.pendingReveal };
    case "opponentRevealed": {
      const p = state.pendingReveal;
      return {
        ...state,
        phase: "correctSoFar",
        pendingReveal: null,
        ...(p
          ? {
              positionFen: p.positionFen,
              solutionIndex: p.solutionIndex,
              accumulatedUserMoves: p.accumulatedUserMoves,
            }
          : {}),
      };
    }
    case "lineAdvanced":
      return {
        ...state,
        phase: "correctSoFar",
        positionFen: action.progress.positionFen,
        solutionIndex: action.progress.solutionIndex,
        accumulatedUserMoves: action.progress.accumulatedUserMoves,
      };
    case "idleElapsed":
      return { ...state, phase: "idle" };
    case "saveFailed":
      return { ...state, phase: "idle", positionFen: action.positionFen, error: action.message };
    case "dismissError":
      return { ...state, error: null };
    default:
      return state;
  }
}

/** Phases the old code lumped into "checking": board locked, opponent/next-move pending. */
function isCheckingLike(phase: TrainingPuzzlePhase): boolean {
  return phase === "checking" || phase === "revealingOpponent" || phase === "resolving";
}

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

type AppRouter = ReturnType<typeof useRouter>;

export interface TrainingPuzzleMachine {
  phase: TrainingPuzzlePhase;
  /** FEN to render: local position, falling back to the exercise start FEN. */
  displayFen: string;
  /** Side for the indicator (pinned to the submitting side while resolving). */
  turnForLabel: "w" | "b";
  boardDisabled: boolean;
  preMoveEnabled: boolean;
  saveError: string | null;
  dismissError: () => void;
  handleBoardMove: (uci: string, newFen: string) => Promise<void>;
  handleQueuePreMove: (uci: string) => void;
  handleSkip: () => Promise<void>;
}

export function useTrainingPuzzleMachine(params: {
  readyState: ReadyTrainingState | null;
  reload: (opts?: ReloadTrainingOptions) => Promise<void>;
  router: AppRouter;
}): TrainingPuzzleMachine {
  const { readyState, reload, router } = params;

  const [state, dispatch] = React.useReducer(reducer, INITIAL_STATE);

  const baseFen = readyState?.exercise.fen ?? "";
  const displayFen = state.positionFen ?? baseFen;

  /** Latest state for the memoized async handlers to read without re-creating. */
  const stateRef = React.useRef(state);
  React.useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  /** Timing that is not UI state. */
  const attemptStartedAtRef = React.useRef(0);
  const firstUserMoveAtRef = React.useRef<number | null>(null);
  /** Synchronous double-fire guard: the board can fire twice for one gesture
   *  (drop + synthetic click) before React re-renders and disables it. */
  const boardMoveInFlightRef = React.useRef(false);
  /** Imperative pre-move queue; executed when the board returns to the trainee. */
  const queuedPreMoveUciRef = React.useRef<string | null>(null);

  /** Leave the exercise. Held in a ref so the timer effect never re-subscribes. */
  const onExit = React.useCallback(
    (exit: { cycleRunId: string; cycleComplete: boolean }) => {
      if (exit.cycleComplete) {
        router.replace(cycleSummaryRoute(exit.cycleRunId));
      } else {
        void reload({ silent: true });
      }
    },
    [reload, router]
  );
  const onExitRef = React.useRef(onExit);
  React.useLayoutEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  const cycleRunId = readyState?.cycleRun.id;
  const exerciseId = readyState?.exercise.id;

  // Restore local puzzle state when the active exercise/cycle changes: pick up
  // in-progress multi-move state from sessionStorage, else reset to the start.
  // useLayoutEffect: align before paint so the board never flashes a stale FEN.
  React.useLayoutEffect(() => {
    if (!readyState || cycleRunId == null || exerciseId == null) return;
    boardMoveInFlightRef.current = false;
    queuedPreMoveUciRef.current = null;
    const progress = getPuzzleProgress(cycleRunId, exerciseId);
    if (progress && progress.currentSolutionIndex > 0) {
      dispatch({
        type: "restore",
        positionFen: progress.currentFen,
        solutionIndex: progress.currentSolutionIndex,
        accumulatedUserMoves: progress.accumulatedUserMoves,
      });
    } else {
      dispatch({
        type: "restore",
        positionFen: null,
        solutionIndex: 0,
        accumulatedUserMoves: [],
      });
    }
    attemptStartedAtRef.current = Date.now();
    firstUserMoveAtRef.current = null;
    if (readyState.sessionId) {
      notifyPuzzleActivated({
        sessionId: readyState.sessionId,
        trainingSetId: readyState.trainingSet.id,
        puzzleId: readyState.exercise.id,
        puzzleNumber: readyState.exercise.puzzleNumber,
        difficulty: readyState.exercise.difficulty,
        cycleNumber: readyState.cycleRun.cycleNumber,
      });
    }
    // Only exercise/cycle identity: restore is a one-shot per puzzle presentation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleRunId, exerciseId]);

  // The single timer owner: each timed phase schedules exactly one follow-up and
  // clears it on any phase change or unmount. Replaces the three timer refs and
  // all their manual clearTimeout choreography.
  React.useEffect(() => {
    switch (state.phase) {
      case "revealingOpponent": {
        const id = setTimeout(() => {
          boardMoveInFlightRef.current = false;
          dispatch({ type: "opponentRevealed" });
        }, OPPONENT_REPLY_TOTAL_DELAY_MS);
        return () => clearTimeout(id);
      }
      case "correctSoFar": {
        const id = setTimeout(
          () => dispatch({ type: "idleElapsed" }),
          POST_CORRECT_IDLE_DELAY_MS
        );
        return () => clearTimeout(id);
      }
      case "resolving": {
        const id = setTimeout(
          () => dispatch({ type: "showTransition" }),
          PUZZLE_RESOLVE_UI_DELAY_MS
        );
        return () => clearTimeout(id);
      }
      case "transitioning": {
        const exit = state.exit;
        const id = setTimeout(() => {
          if (exit) onExitRef.current(exit);
        }, EXERCISE_TRANSITION_MS);
        return () => clearTimeout(id);
      }
      default:
        return;
    }
  }, [state.phase, state.exit]);

  const handleBoardMove = React.useCallback(
    async (uci: string, newFen: string) => {
      if (!readyState || !readyState.sessionId) return;
      if (boardMoveInFlightRef.current) return;

      const s = stateRef.current;
      boardMoveInFlightRef.current = true;
      const fenBefore = s.positionFen ?? baseFen;
      const solvingSide = parseSideToMoveFromFen(fenBefore);
      const indexToUse = s.solutionIndex;
      const accumulatedToUse = [...s.accumulatedUserMoves];
      dispatch({ type: "moveSubmitted", positionFen: newFen, solvingSide });

      if (indexToUse === 0 && firstUserMoveAtRef.current == null) {
        firstUserMoveAtRef.current = Date.now();
      }
      const timeToFirstMoveMs =
        firstUserMoveAtRef.current != null
          ? Math.max(0, firstUserMoveAtRef.current - attemptStartedAtRef.current)
          : undefined;

      try {
        const result = await submitAttempt({
          exerciseId: readyState.exercise.id,
          cycleRunId: readyState.cycleRun.id,
          trainingSetId: readyState.trainingSet.id,
          sessionId: readyState.sessionId,
          fen: fenBefore || baseFen,
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
          timeToFirstMoveMs,
          puzzleNumber: readyState.exercise.puzzleNumber,
          difficulty: readyState.exercise.difficulty,
          cycleNumber: readyState.cycleRun.cycleNumber,
        });

        if (!result.isCorrect || result.puzzleComplete) {
          clearPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
          dispatch({
            type: "resolved",
            exit: {
              cycleRunId: readyState.cycleRun.id,
              cycleComplete: Boolean(result.cycleComplete),
            },
          });
          boardMoveInFlightRef.current = false;
          return;
        }

        const progress: LineProgress = {
          positionFen: result.nextFen ?? newFen,
          solutionIndex: result.nextSolutionIndex ?? indexToUse + 1,
          accumulatedUserMoves: [...accumulatedToUse, result.normalizedAttemptedMove],
        };
        setPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id, {
          currentFen: progress.positionFen,
          currentSolutionIndex: progress.solutionIndex,
          accumulatedUserMoves: progress.accumulatedUserMoves,
        });

        const hasOpponentReply =
          Array.isArray(result.autoPlayedMoves) && result.autoPlayedMoves.length > 0;
        if (hasOpponentReply) {
          // Keep the trainee's move on the board; the reveal timer applies the
          // opponent reply, then unlocks the double-fire guard.
          dispatch({ type: "awaitOpponentReveal", pendingReveal: progress });
          return;
        }

        dispatch({ type: "lineAdvanced", progress });
        boardMoveInFlightRef.current = false;
      } catch {
        dispatch({
          type: "saveFailed",
          positionFen: fenBefore || baseFen,
          message: MOVE_SAVE_ERROR_MESSAGE,
        });
        boardMoveInFlightRef.current = false;
      }
    },
    // readyState/baseFen only; everything mutable is read via refs.
    [readyState, baseFen]
  );

  const handleSkip = React.useCallback(async () => {
    if (!readyState || !readyState.sessionId) return;
    const s = stateRef.current;
    if (isCheckingLike(s.phase) || s.phase === "transitioning") return;
    queuedPreMoveUciRef.current = null;
    dispatch({ type: "skipStarted" });
    clearPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
    try {
      const { cycleComplete } = await skipPuzzle({
        exerciseId: readyState.exercise.id,
        cycleRunId: readyState.cycleRun.id,
        trainingSetId: readyState.trainingSet.id,
        sessionId: readyState.sessionId,
        attemptStartedAt: attemptStartedAtRef.current,
        puzzleNumber: readyState.exercise.puzzleNumber,
        difficulty: readyState.exercise.difficulty,
        cycleNumber: readyState.cycleRun.cycleNumber,
      });
      onExitRef.current({ cycleRunId: readyState.cycleRun.id, cycleComplete });
    } catch {
      dispatch({
        type: "saveFailed",
        positionFen: s.positionFen,
        message: SKIP_SAVE_ERROR_MESSAGE,
      });
    }
  }, [readyState]);

  const handleQueuePreMove = React.useCallback((uci: string) => {
    if (!isCheckingLike(stateRef.current.phase)) return;
    queuedPreMoveUciRef.current = uci;
  }, []);

  // Execute one queued pre-move as soon as the board returns to the trainee side.
  // Invalid queued moves are silently discarded.
  React.useEffect(() => {
    const queued = queuedPreMoveUciRef.current;
    if (!readyState || !queued) return;
    if (isCheckingLike(state.phase) || state.phase === "transitioning") return;
    if (boardMoveInFlightRef.current) return;
    if (parseSideToMoveFromFen(displayFen) !== readyState.exercise.sideToMove) return;
    try {
      const chess = new Chess(displayFen);
      const parsed = parseUciForExecution(queued);
      const made = parsed ? chess.move(parsed) : chess.move(queued);
      queuedPreMoveUciRef.current = null;
      if (!made) return;
      const m = made as { from: string; to: string; promotion?: string };
      void handleBoardMove(`${m.from}${m.to}${m.promotion ?? ""}`, chess.fen());
    } catch {
      queuedPreMoveUciRef.current = null;
    }
  }, [readyState, state.phase, displayFen, handleBoardMove]);

  const dismissError = React.useCallback(() => dispatch({ type: "dismissError" }), []);

  const turnForLabel = isCheckingLike(state.phase)
    ? state.solvingSide
    : parseSideToMoveFromFen(displayFen);

  return {
    phase: state.phase,
    displayFen,
    turnForLabel,
    boardDisabled: state.phase !== "idle",
    preMoveEnabled: isCheckingLike(state.phase),
    saveError: state.error,
    dismissError,
    handleBoardMove,
    handleQueuePreMove,
    handleSkip,
  };
}
