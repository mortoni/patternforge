/**
 * CycleRun entity: one pass through a training set.
 */

export type CycleRunStatus = "active" | "completed";

export interface CycleRun {
  id: string;
  trainingSetId: string;
  cycleNumber: number;
  status: CycleRunStatus;
  startedAt: string;
  completedAt?: string;
  totalTimeMs: number;
  solvedCount: number;
  totalExercises: number;
  nextExerciseIndex: number;
}
