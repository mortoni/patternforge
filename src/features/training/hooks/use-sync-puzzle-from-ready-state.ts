"use client";

import * as React from "react";
import { getPuzzleProgress } from "../services/puzzle-progress-storage";
import type { ActiveTrainingState } from "../types";

export type ReadyTrainingState = Extract<
  ActiveTrainingState,
  { status: "ready" }
>;

export type TrainingPuzzleUiState =
  | "idle"
  | "checking"
  | "correct_so_far"
  | "transitioning";

export interface SyncPuzzleRefs {
  boardMoveInFlightRef: React.MutableRefObject<boolean>;
  autoPlayTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  exerciseTransitionTimerRef: React.MutableRefObject<
    ReturnType<typeof setTimeout> | null
  >;
  currentSolutionIndexRef: React.MutableRefObject<number>;
  accumulatedUserMovesRef: React.MutableRefObject<string[]>;
  currentFenRef: React.MutableRefObject<string>;
  attemptStartedAtRef: React.MutableRefObject<number>;
}

export interface SyncPuzzleSetters {
  setPositionFen: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentSolutionIndex: React.Dispatch<React.SetStateAction<number>>;
  setAccumulatedUserMoves: React.Dispatch<React.SetStateAction<string[]>>;
  setPuzzleState: React.Dispatch<React.SetStateAction<TrainingPuzzleUiState>>;
}

/**
 * When the active exercise or cycle changes, restore local puzzle UI from
 * sessionStorage progress or reset to the exercise start FEN.
 */
export function useSyncPuzzleFromReadyState(
  readyState: ReadyTrainingState | null,
  refs: SyncPuzzleRefs,
  setters: SyncPuzzleSetters
): void {
  const {
    boardMoveInFlightRef,
    autoPlayTimerRef,
    exerciseTransitionTimerRef,
    currentSolutionIndexRef,
    accumulatedUserMovesRef,
    currentFenRef,
    attemptStartedAtRef,
  } = refs;
  const {
    setPositionFen,
    setCurrentSolutionIndex,
    setAccumulatedUserMoves,
    setPuzzleState,
  } = setters;

  const cycleRunId = readyState?.cycleRun.id;
  const exerciseId = readyState?.exercise.id;

  React.useEffect(() => {
    if (!readyState || cycleRunId == null || exerciseId == null) return;
    boardMoveInFlightRef.current = false;
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (exerciseTransitionTimerRef.current) {
      clearTimeout(exerciseTransitionTimerRef.current);
      exerciseTransitionTimerRef.current = null;
    }
    const progress = getPuzzleProgress(cycleRunId, exerciseId);
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
    // Intentionally only cycle + exercise identity; `readyState` / setters / refs omitted (stable or intentional).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleRunId, exerciseId]);
}
