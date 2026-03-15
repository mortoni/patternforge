/**
 * Transform and validation helpers for the puzzle import pipeline.
 */

import { puzzleCsvRowSchema } from "@/domain/training/entities/puzzle-import.schema";
import type { NormalizedPuzzle } from "@/domain/training/types/puzzle-import.types";

export interface ValidationError {
  row: number;
  message: string;
  path?: string;
}

export interface ValidationResult {
  valid: NormalizedPuzzle[];
  errors: ValidationError[];
}

/**
 * Transform a raw CSV row (record of strings) into a normalized puzzle.
 * Returns validation errors with 1-based row numbers.
 */
export function validateAndTransformRow(
  row: Record<string, string>,
  rowNumber: number
): { success: true; data: NormalizedPuzzle } | { success: false; errors: ValidationError[] } {
  const parsed = puzzleCsvRowSchema.safeParse(row);
  if (parsed.success) {
    const data = transformToNormalized(parsed.data, rowNumber);
    return { success: true, data };
  }
  const errors: ValidationError[] = parsed.error.issues.map((issue) => ({
    row: rowNumber,
    message: issue.message,
    path: issue.path.join(".") || undefined,
  }));
  return { success: false, errors };
}

/**
 * Transform a parsed CSV row into normalized puzzle with id and createdAt.
 */
function transformToNormalized(
  row: {
    trainingSetId: "easy" | "intermediate" | "advanced";
    puzzleNumber: number;
    fen: string;
    sideToMove: "w" | "b";
    solutionMoves: string;
    motifTags: string;
    gameSource: string;
    difficulty: "easy" | "intermediate" | "advanced";
  },
  _rowNumber: number
): NormalizedPuzzle {
  const id = formatPuzzleId(row.trainingSetId, row.puzzleNumber);
  const solutionMoves = row.solutionMoves
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const motifTags = row.motifTags
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // firstMove: use first solution move; convert to UCI in seed if needed, or store SAN and normalize on compare
  const firstMove = solutionMoves.length > 0 ? solutionMoves[0] : undefined;

  return {
    id,
    trainingSetId: row.trainingSetId,
    puzzleNumber: row.puzzleNumber,
    fen: row.fen,
    sideToMove: row.sideToMove,
    solutionMoves,
    firstMove,
    motifTags,
    gameSource: row.gameSource,
    difficulty: row.difficulty,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Format puzzle id: easy-0001, intermediate-0001, advanced-0001.
 */
export function formatPuzzleId(
  trainingSetId: string,
  puzzleNumber: number
): string {
  const padded = String(puzzleNumber).padStart(4, "0");
  return `${trainingSetId}-${padded}`;
}

/**
 * Validate and transform all CSV rows. Collects all errors.
 */
export function validateAndTransformAll(
  rows: Record<string, string>[]
): ValidationResult {
  const valid: NormalizedPuzzle[] = [];
  const errors: ValidationError[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // 1-based, header is row 1
    const result = validateAndTransformRow(row, rowNumber);
    if (result.success) {
      valid.push(result.data);
    } else {
      errors.push(...result.errors);
    }
  });

  return { valid, errors };
}
