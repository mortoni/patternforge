/**
 * Zod schemas for CSV row validation and normalized puzzle output.
 */

import { z } from "zod";

/** Matches DB `difficulty` on exercises / training sets. */
const importDifficultySchema = z.enum([
  "easy",
  "intermediate",
  "advanced",
  "custom",
]);

/**
 * Arbitrary training group id (which set the puzzle belongs to).
 * Not the same as tactical difficulty — use `difficulty` for that.
 */
const trainingSetGroupIdSchema = z
  .string()
  .trim()
  .min(1, "trainingSetId is required")
  .max(64);

const sideToMoveSchema = z.enum(["w", "b"]);

/** Schema for raw CSV row (all fields strings). Validates and coerces. */
export const puzzleCsvRowSchema = z.object({
  trainingSetId: trainingSetGroupIdSchema,
  puzzleNumber: z.coerce.number().int().positive(),
  fen: z.string().trim().min(1, "fen must be non-empty"),
  sideToMove: sideToMoveSchema,
  solutionMoves: z.string().trim().min(1, "solutionMoves must be non-empty"),
  motifTags: z.string().trim(),
  gameSource: z.string().trim(),
  difficulty: importDifficultySchema,
  comment: z.string().trim().optional(),
});

export type PuzzleCsvRowParsed = z.infer<typeof puzzleCsvRowSchema>;

/** Input for schema: raw string row from CSV (before coercion). */
export const puzzleCsvRowInputSchema = z.object({
  trainingSetId: z.string().trim(),
  puzzleNumber: z.string().trim(),
  fen: z.string().trim(),
  sideToMove: z.string().trim(),
  solutionMoves: z.string().trim(),
  motifTags: z.string().trim(),
  gameSource: z.string().trim(),
  difficulty: z.string().trim(),
  comment: z.string().trim().optional(),
});

/** Normalized puzzle schema (after transform). */
export const normalizedPuzzleSchema = z.object({
  id: z.string(),
  trainingSetId: trainingSetGroupIdSchema,
  puzzleNumber: z.number().int().positive(),
  fen: z.string(),
  sideToMove: sideToMoveSchema,
  solutionMoves: z.array(z.string()),
  firstMove: z.string().optional(),
  motifTags: z.array(z.string()),
  gameSource: z.string(),
  difficulty: importDifficultySchema,
  comment: z.string().optional(),
  createdAt: z.string(),
});

export type NormalizedPuzzleSchema = z.infer<typeof normalizedPuzzleSchema>;
