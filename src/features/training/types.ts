/**
 * Training feature view models and state types.
 */

export type ActiveTrainingState =
  | { status: "no-training-set" }
  | {
      status: "no-active-cycle";
      trainingSetId: string;
      trainingSetName: string;
      /** Most recently completed cycle for this set (for low-emphasis context). */
      lastCompletedCycle?: {
        cycleRunId: string;
        cycleNumber: number;
        totalTimeMs: number;
        sessionCount: number;
      };
    }
  | {
      status: "exercise-not-found";
      trainingSetId: string;
      cycleRunId: string;
    }
  | {
      status: "cycle-complete";
      cycleRunId: string;
      trainingSetId: string;
      trainingSetName: string;
      cycleNumber: number;
      /** Final solved count for the completed cycle. */
      solvedCount?: number;
      totalExercises?: number;
    }
  | {
      status: "ready";
      /** Set by interaction layer (hook) when entering training; loader does not create sessions. */
      sessionId?: string;
      trainingSet: {
        id: string;
        name: string;
        description?: string;
      };
      cycleRun: {
        id: string;
        cycleNumber: number;
        solvedCount: number;
        totalExercises: number;
        nextExerciseIndex: number;
        status: "active";
      };
      exercise: {
        id: string;
        puzzleNumber?: number;
        fen: string;
        sideToMove: "w" | "b";
        solutionMoves: string[];
        /** Expected first move (SAN or UCI). Comparison normalizes to UCI. */
        firstMove?: string;
        gameSource?: string;
        difficulty?: string;
        comment?: string;
      };
      exerciseIndex: number;
      totalExercises: number;
      boardOrientation: "white" | "black";
    };
