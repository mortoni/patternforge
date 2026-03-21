/**
 * Transform and validation helpers for the puzzle import pipeline.
 */

import { puzzleCsvRowSchema } from "@/domain/training/entities/puzzle-import.schema";
import type {
  GeneratedTrainingSetMeta,
  ImportDifficulty,
  NormalizedPuzzle,
} from "@/domain/training/types/puzzle-import.types";

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
    trainingSetId: string;
    puzzleNumber: number;
    fen: string;
    sideToMove: "w" | "b";
    solutionMoves: string;
    motifTags: string;
    gameSource: string;
    difficulty: ImportDifficulty;
    comment?: string;
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
    comment: row.comment?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Format puzzle id: `{trainingSetId}-0001` (e.g. easy-0001, test-0001).
 */
export function formatPuzzleId(
  trainingSetId: string,
  puzzleNumber: number
): string {
  const padded = String(puzzleNumber).padStart(4, "0");
  return `${trainingSetId}-${padded}`;
}

const CANONICAL_SET_META: Record<
  string,
  Pick<GeneratedTrainingSetMeta, "name" | "description" | "difficulty">
> = {
  easy: {
    name: "Woodpecker Easy",
    description: "Woodpecker method — easier positions.",
    difficulty: "easy",
  },
  intermediate: {
    name: "Woodpecker Intermediate",
    description: "Woodpecker method — intermediate level.",
    difficulty: "intermediate",
  },
  advanced: {
    name: "Woodpecker Advanced",
    description: "Woodpecker method — advanced positions.",
    difficulty: "advanced",
  },
};

function titleCaseSetId(id: string): string {
  return id
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Group puzzles by `trainingSetId`; puzzles per group sorted by `puzzleNumber`.
 */
export function groupPuzzlesByTrainingSet(
  puzzles: NormalizedPuzzle[]
): Map<string, NormalizedPuzzle[]> {
  const m = new Map<string, NormalizedPuzzle[]>();
  for (const p of puzzles) {
    const list = m.get(p.trainingSetId) ?? [];
    list.push(p);
    m.set(p.trainingSetId, list);
  }
  for (const list of m.values()) {
    list.sort((a, b) => a.puzzleNumber - b.puzzleNumber);
  }
  return m;
}

/**
 * Build training set metadata for every group present in validated puzzles.
 */
export function buildTrainingSetMetaFromPuzzles(
  valid: NormalizedPuzzle[]
): GeneratedTrainingSetMeta[] {
  const bySet = groupPuzzlesByTrainingSet(valid);
  const setIds = [...bySet.keys()].sort((a, b) => a.localeCompare(b));
  return setIds.map((id) => {
    const canonical = CANONICAL_SET_META[id];
    if (canonical) {
      return { id, ...canonical };
    }
    const puzzles = bySet.get(id) ?? [];
    const first = puzzles[0]?.difficulty;
    const difficulty: ImportDifficulty =
      first === "easy" ||
      first === "intermediate" ||
      first === "advanced" ||
      first === "custom"
        ? first
        : "custom";
    return {
      id,
      name: titleCaseSetId(id) || id,
      description: `Imported exercises for «${id}».`,
      difficulty,
    };
  });
}

/** Safe filename segment for `{id}-exercises.json`. */
export function exercisesJsonBasename(trainingSetId: string): string {
  return trainingSetId.replace(/[^a-zA-Z0-9_-]/g, "_");
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
