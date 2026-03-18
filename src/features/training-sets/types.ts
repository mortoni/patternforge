/**
 * View models and result types for the Training Sets feature.
 */

import type { CycleRunSchema } from "@/db/schema";

export type DifficultyLabel = "easy" | "intermediate" | "advanced" | "custom";

export interface TrainingSetOverview {
  trainingSetId: string;
  name: string;
  description?: string;
  difficulty: DifficultyLabel;
  /** From set metadata when present. */
  source?: string;
  /** From set metadata when present. */
  tags?: string[];
  exerciseCount: number;
  currentCycleNumber: number | null;
  cycleStatus: CycleRunSchema["status"] | null;
  solvedCount: number;
  totalExercises: number;
  completionPercentage: number;
  actionLabel: "Continue Training" | "Start Cycle 1" | "Start Next Cycle" | "No exercises";
}

/** Source label for display. TODO: model source explicitly in DB when we have multiple import sources. */
export type TrainingSetSourceLabel = "Lichess" | "Custom" | "Unknown";

/** Status for table display. */
export type TrainingSetStatusLabel = "Not started" | "Active" | "Completed";

/** Row view model for Training Sets table/list. */
export interface TrainingSetTableRow {
  id: string;
  name: string;
  description?: string;
  source: TrainingSetSourceLabel;
  difficulty: DifficultyLabel;
  tags: string[];
  exerciseCount: number;
  status: TrainingSetStatusLabel;
  currentCycleLabel: string;
  solvedCount: number;
  totalExercises: number;
  completionPercentage: number;
  actionLabel: "Continue Training" | "Start Cycle 1" | "Start Next Cycle" | "No exercises";
}

export interface ContinueTrainingResult {
  success: boolean;
  route: "/app/training";
}

export interface StartNextCycleResult {
  success: boolean;
  cycleRunId: string;
  route: "/app/training";
}

// ---- Training Set Detail (Phase 6) ----

export interface TrainingSetDetailSet {
  id: string;
  name: string;
  description?: string;
  source?: string;
  difficulty: DifficultyLabel;
  tags: string[];
  exerciseCount: number;
  createdAt: string;
}

export interface TrainingSetDetailActiveCycle {
  id: string;
  cycleNumber: number;
  status: "active";
  solvedCount: number;
  totalExercises: number;
  completionPercentage: number;
  startedAt: string;
}

export interface TrainingSetDetailCycleHistoryRow {
  id: string;
  cycleNumber: number;
  status: "active" | "completed";
  solvedCount: number;
  totalExercises: number;
  completionPercentage: number;
  startedAt: string;
  completedAt?: string;
  totalTimeMs: number;
  sessionCount: number;
}

export interface TrainingSetDetailActions {
  primaryActionLabel: "Continue Training" | "Start Cycle 1" | "Start Next Cycle" | "No exercises";
  canContinue: boolean;
  canStartNextCycle: boolean;
}

export interface TrainingSetDetailViewModel {
  trainingSet: TrainingSetDetailSet;
  activeCycle: TrainingSetDetailActiveCycle | null;
  cycleHistory: TrainingSetDetailCycleHistoryRow[];
  actions: TrainingSetDetailActions;
  totalCompletedCycles: number;
  /** Total active time (ms) across all sessions for this set. Optional. */
  totalTrainingTimeMs?: number;
}
