"use client";

import * as React from "react";
import type { useRouter } from "next/navigation";
import { cycleSummaryRoute } from "@/lib/constants";
import { parseSideToMoveFromFen } from "@/lib/chess/side-to-move";
import { submitAttempt, skipPuzzle } from "../services/training-solver.service";
import {
  setPuzzleProgress,
  clearPuzzleProgress,
} from "../services/puzzle-progress-storage";
import type { ReloadTrainingOptions } from "./use-active-training";
import type { ReadyTrainingState, TrainingPuzzleUiState } from "./use-sync-puzzle-from-ready-state";
import {
  EXERCISE_TRANSITION_MS,
  OPPONENT_REPLY_TOTAL_DELAY_MS,
  POST_CORRECT_IDLE_DELAY_MS,
  PUZZLE_RESOLVE_UI_DELAY_MS,
} from "../training-board-timing";

type AppRouter = ReturnType<typeof useRouter>;

/**
 * Shown when persisting an attempt/skip throws (e.g. IndexedDB write blocked by
 * private-browsing or storage quota). The move is rolled back to the pre-attempt
 * position, so the user can retry rather than silently losing the move.
 */
export const MOVE_SAVE_ERROR_MESSAGE =
  "Couldn't save your move — it wasn't recorded. This can happen in private browsing or when storage is full. Try again.";
export const SKIP_SAVE_ERROR_MESSAGE =
  "Couldn't skip this puzzle — try again.";

export interface TrainingBoardRefs {
  currentFenRef: React.MutableRefObject<string>;
  currentSolutionIndexRef: React.MutableRefObject<number>;
  accumulatedUserMovesRef: React.MutableRefObject<string[]>;
  solvingSideRef: React.MutableRefObject<"w" | "b">;
  boardMoveInFlightRef: React.MutableRefObject<boolean>;
  attemptStartedAtRef: React.MutableRefObject<number>;
  firstUserMoveAtRef: React.MutableRefObject<number | null>;
  autoPlayTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  opponentRevealTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  exerciseTransitionTimerRef: React.MutableRefObject<
    ReturnType<typeof setTimeout> | null
  >;
}

export function useClearExerciseTransitionTimerOnUnmount(
  exerciseTransitionTimerRef: React.MutableRefObject<
    ReturnType<typeof setTimeout> | null
  >
): void {
  React.useEffect(() => {
    return () => {
      if (exerciseTransitionTimerRef.current) {
        clearTimeout(exerciseTransitionTimerRef.current);
        exerciseTransitionTimerRef.current = null;
      }
    };
  }, [exerciseTransitionTimerRef]);
}

export function useTrainingBoardActions(
  readyState: ReadyTrainingState | null,
  baseFen: string,
  puzzleState: TrainingPuzzleUiState,
  reload: (opts?: ReloadTrainingOptions) => Promise<void>,
  router: AppRouter,
  refs: TrainingBoardRefs,
  setters: {
    setPositionFen: React.Dispatch<React.SetStateAction<string | null>>;
    setPuzzleState: React.Dispatch<React.SetStateAction<TrainingPuzzleUiState>>;
    setCurrentSolutionIndex: React.Dispatch<React.SetStateAction<number>>;
    setAccumulatedUserMoves: React.Dispatch<React.SetStateAction<string[]>>;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
  }
): { handleBoardMove: (uci: string, newFen: string) => Promise<void>; handleSkip: () => Promise<void> } {
  const {
    currentFenRef,
    currentSolutionIndexRef,
    accumulatedUserMovesRef,
    solvingSideRef,
    boardMoveInFlightRef,
    attemptStartedAtRef,
    firstUserMoveAtRef,
    autoPlayTimerRef,
    opponentRevealTimerRef,
    exerciseTransitionTimerRef,
  } = refs;
  const {
    setPositionFen,
    setPuzzleState,
    setCurrentSolutionIndex,
    setAccumulatedUserMoves,
    setError,
  } = setters;

  useClearExerciseTransitionTimerOnUnmount(exerciseTransitionTimerRef);

  React.useEffect(() => {
    return () => {
      if (opponentRevealTimerRef.current) {
        clearTimeout(opponentRevealTimerRef.current);
        opponentRevealTimerRef.current = null;
      }
    };
  }, [opponentRevealTimerRef]);

  const handleBoardMove = React.useCallback(
    async (uci: string, newFen: string) => {
      if (!readyState || !readyState.sessionId) return;
      if (boardMoveInFlightRef.current) return;
      if (opponentRevealTimerRef.current) {
        clearTimeout(opponentRevealTimerRef.current);
        opponentRevealTimerRef.current = null;
      }

      boardMoveInFlightRef.current = true;
      setError(null);
      const fenBefore = currentFenRef.current;
      solvingSideRef.current = parseSideToMoveFromFen(fenBefore);
      setPositionFen(newFen);
      setPuzzleState("checking");
      const indexToUse = currentSolutionIndexRef.current;
      const accumulatedToUse = [...accumulatedUserMovesRef.current];
      const fenToUse = fenBefore || baseFen;
      if (indexToUse === 0 && firstUserMoveAtRef.current == null) {
        firstUserMoveAtRef.current = Date.now();
      }
      const timeToFirstMoveMs =
        firstUserMoveAtRef.current != null
          ? Math.max(0, firstUserMoveAtRef.current - attemptStartedAtRef.current)
          : undefined;
      const puzzleMeta = {
        puzzleNumber: readyState.exercise.puzzleNumber,
        difficulty: readyState.exercise.difficulty,
        cycleNumber: readyState.cycleRun.cycleNumber,
      };

      const scheduleEndOfExercise = (cycleRunId: string, cycleComplete: boolean) => {
        if (exerciseTransitionTimerRef.current) {
          clearTimeout(exerciseTransitionTimerRef.current);
        }
        exerciseTransitionTimerRef.current = setTimeout(() => {
          setPuzzleState("transitioning");
          exerciseTransitionTimerRef.current = setTimeout(() => {
            exerciseTransitionTimerRef.current = null;
            if (cycleComplete) {
              router.replace(cycleSummaryRoute(cycleRunId));
            } else {
              void reload({ silent: true });
            }
          }, EXERCISE_TRANSITION_MS);
        }, PUZZLE_RESOLVE_UI_DELAY_MS);
      };

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
          timeToFirstMoveMs,
          ...puzzleMeta,
        });

        if (!result.isCorrect) {
          clearPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
          scheduleEndOfExercise(
            readyState.cycleRun.id,
            Boolean(result.cycleComplete)
          );
          return;
        }

        if (result.puzzleComplete) {
          clearPuzzleProgress(readyState.cycleRun.id, readyState.exercise.id);
          scheduleEndOfExercise(
            readyState.cycleRun.id,
            Boolean(result.cycleComplete)
          );
          return;
        }

        const nextFen = result.nextFen ?? newFen;
        const nextIndex = result.nextSolutionIndex ?? indexToUse + 1;
        const nextAccumulated = [
          ...accumulatedToUse,
          result.normalizedAttemptedMove,
        ];

        const hasOpponentReply =
          Array.isArray(result.autoPlayedMoves) && result.autoPlayedMoves.length > 0;

        const applyCorrectLineProgress = () => {
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
          }, POST_CORRECT_IDLE_DELAY_MS);
        };

        if (hasOpponentReply) {
          opponentRevealTimerRef.current = setTimeout(() => {
            opponentRevealTimerRef.current = null;
            applyCorrectLineProgress();
            boardMoveInFlightRef.current = false;
          }, OPPONENT_REPLY_TOTAL_DELAY_MS);
          return;
        }

        applyCorrectLineProgress();
      } catch {
        setPuzzleState("idle");
        setPositionFen(fenBefore || baseFen);
        setError(MOVE_SAVE_ERROR_MESSAGE);
      } finally {
        if (!opponentRevealTimerRef.current) {
          boardMoveInFlightRef.current = false;
        }
      }
    },
    // Refs and setState dispatchers are stable; keep deps aligned with the page’s contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readyState, baseFen, reload, router]
  );

  const handleSkip = React.useCallback(async () => {
    if (!readyState || !readyState.sessionId) return;
    if (puzzleState === "checking" || puzzleState === "transitioning") return;
    setPuzzleState("checking");
    setError(null);
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
      if (cycleComplete) {
        router.replace(cycleSummaryRoute(readyState.cycleRun.id));
      } else {
        await reload({ silent: true });
      }
    } catch {
      setPuzzleState("idle");
      setError(SKIP_SAVE_ERROR_MESSAGE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyState, puzzleState, reload, router]);

  return { handleBoardMove, handleSkip };
}
