/**
 * Zod schemas for CSV row validation and normalized puzzle output.
 */

import { z } from "zod";

const trainingSetIdSchema = z.enum(["easy", "intermediate", "advanced"]);
const sideToMoveSchema = z.enum(["w", "b"]);

/** Schema for raw CSV row (all fields strings). Validates and coerces. */
export const puzzleCsvRowSchema = z
  .object({
    trainingSetId: z.enum(["easy", "intermediate", "advanced"]),
    puzzleNumber: z.coerce.number().int().positive(),
    fen: z.string().trim().min(1, "fen must be non-empty"),
    sideToMove: sideToMoveSchema,
    solutionMoves: z.string().trim().min(1, "solutionMoves must be non-empty"),
    motifTags: z.string().trim(),
    gameSource: z.string().trim(),
    difficulty: z.enum(["easy", "intermediate", "advanced"]),
    comment: z.string().trim().optional(),
  })
  .refine(
    (row) => row.trainingSetId === row.difficulty,
    { message: "trainingSetId and difficulty must match", path: ["difficulty"] }
  );

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
  trainingSetId: trainingSetIdSchema,
  puzzleNumber: z.number().int().positive(),
  fen: z.string(),
  sideToMove: sideToMoveSchema,
  solutionMoves: z.array(z.string()),
  firstMove: z.string().optional(),
  motifTags: z.array(z.string()),
  gameSource: z.string(),
  difficulty: trainingSetIdSchema,
  comment: z.string().optional(),
  createdAt: z.string(),
});

export type NormalizedPuzzleSchema = z.infer<typeof normalizedPuzzleSchema>;
