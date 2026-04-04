/**
 * Zod schemas and inferred types for all DB entities.
 * Use for validation when reading from IndexedDB or external sources.
 */

import { z } from "zod";
import { BOARD_STYLE_IDS } from "@/lib/chess/board-styles";

export const appInstanceSchema = z.object({
  installationId: z.string(),
  createdAt: z.string(),
  lastOpenedAt: z.string(),
});
export type AppInstanceSchema = z.infer<typeof appInstanceSchema>;

export const themeSchema = z.enum(["light", "dark", "system"]);
export const boardOrientationSchema = z.enum(["white", "black"]);

export const boardStyleSchema = z.enum(
  BOARD_STYLE_IDS as unknown as [string, ...string[]]
);

export const appSettingsSchema = z.object({
  id: z.string(),
  theme: themeSchema,
  boardOrientation: boardOrientationSchema,
  /** Global chessboard palette; persisted in IndexedDB settings row. */
  boardStyle: boardStyleSchema.optional(),
  lastTrainingSetId: z.string().optional(),
  autoBoardOrientation: z.boolean()
});
export type AppSettingsSchema = z.infer<typeof appSettingsSchema>;

export const difficultySchema = z.enum([
  "easy",
  "intermediate",
  "advanced",
  "custom",
]);

/** Optional source label for set metadata. TODO: wire to import pipeline when we have multiple sources. */
export const trainingSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  difficulty: difficultySchema,
  exerciseIds: z.array(z.string()),
  createdAt: z.string(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type TrainingSetSchema = z.infer<typeof trainingSetSchema>;

export const sideToMoveSchema = z.enum(["w", "b"]);

/** Expected first move of the puzzle (UCI format, e.g. "e2e4" or "e7e8q"). Used for Phase 2 first-move validation. */
export const exerciseSchema = z.object({
  id: z.string(),
  trainingSetId: z.string(),
  fen: z.string(),
  sideToMove: sideToMoveSchema,
  solutionMoves: z.array(z.string()),
  /** Expected first move in UCI format. If missing, derived from solutionMoves[0] where possible. */
  firstMove: z.string().optional(),
  source: z.string().optional(),
  motifTags: z.array(z.string()).optional(),
  createdAt: z.string(),
  puzzleNumber: z.number().int().positive().optional(),
  difficulty: difficultySchema.optional(),
  /** Optional comment / explanation from source (e.g. woodpecker dataset). */
  comment: z.string().optional(),
});
export type ExerciseSchema = z.infer<typeof exerciseSchema>;

export const cycleRunStatusSchema = z.enum(["active", "completed"]);

export const cycleRunSchema = z.object({
  id: z.string(),
  trainingSetId: z.string(),
  cycleNumber: z.number(),
  status: cycleRunStatusSchema,
  startedAt: z.string(),
  completedAt: z.string().optional(),
  totalTimeMs: z.number(),
  solvedCount: z.number(),
  totalExercises: z.number(),
  nextExerciseIndex: z.number(),
});
export type CycleRunSchema = z.infer<typeof cycleRunSchema>;

export const sessionStatusSchema = z.enum([
  "active",
  "completed",
  "abandoned",
]);

export const sessionSchema = z.object({
  id: z.string(),
  trainingSetId: z.string(),
  cycleRunId: z.string(),
  targetPuzzleCount: z.number().optional(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  activeTimeMs: z.number(),
  puzzlesAttempted: z.number(),
  correctCount: z.number(),
  skippedCount: z.number(),
  status: sessionStatusSchema,
});
export type SessionSchema = z.infer<typeof sessionSchema>;

export const attemptResultSchema = z.enum([
  "correct",
  "incorrect",
  "skipped",
]);

export const exerciseAttemptSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  cycleRunId: z.string(),
  /** Optional until full session flow is implemented. */
  sessionId: z.string().optional(),
  startedAt: z.string(),
  finishedAt: z.string().optional(),
  durationMs: z.number(),
  result: attemptResultSchema,
  /** User move(s) in UCI format. Single element for Phase 2 first-move only. */
  userMoves: z.array(z.string()),
});
export type ExerciseAttemptSchema = z.infer<typeof exerciseAttemptSchema>;

export const mistakeStatusSchema = z.enum([
  "needs_review",
  "solved_once",
  "solved_twice",
  "mastered",
]);

export const mistakeEntrySchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  trainingSetId: z.string(),
  createdAt: z.string(),
  lastReviewedAt: z.string().optional(),
  failedAttempts: z.number(),
  solvedReviewCount: z.number(),
  status: mistakeStatusSchema,
});
export type MistakeEntrySchema = z.infer<typeof mistakeEntrySchema>;
