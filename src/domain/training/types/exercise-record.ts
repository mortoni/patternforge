/**
 * Strict JSON contract for the **exercise dataset pipeline** (CSV → normalized JSON).
 *
 * This is not the in-app `Exercise` entity (`entities/exercise.ts`) used by Dexie and training
 * UI. Future pipeline steps map rows into `ExerciseRecord`, then optionally into persistence /
 * runtime models.
 *
 * **CSV / import:** `solution.rawMoves` is editorial input (typically SAN tokens).
 * **Machine line:** `solution.moves` is true UCI from chess.js replay during `exercises:normalize`.
 */

/** Verification lifecycle for a dataset row (engine / manual QA). */
export type ExerciseStatus =
  | "pending"
  | "certified"
  | "manual_review"
  | "broken";

/** Canonical difficulty tier for the dataset (distinct from legacy CSV `ImportDifficulty`). */
export type ExerciseDifficulty = "easy" | "medium" | "hard";

/**
 * Outcome of converting `rawMoves` → UCI in `moves` (chess.js, local only).
 * - **normalized** — every raw token was parsed and appended as UCI.
 * - **partial** — a prefix succeeded; a later token failed.
 * - **failed** — no UCI produced despite non-empty `rawMoves`.
 * - **not_started** — should not appear on emitted contract rows from the current pipeline.
 */
export type SolutionNormalizationStatus =
  | "not_started"
  | "normalized"
  | "partial"
  | "failed";

export interface ExerciseSolution {
  /** Imported / editorial tokens from the source (traceability). Typically SAN. */
  rawMoves: string[];
  /**
   * True UCI strings (`from` + `to` + optional promotion) after successful parses.
   * Shorter than `rawMoves` when `normalizationStatus` is `partial`; empty when `failed`.
   */
  moves: string[];
  /**
   * Encoding of `moves`: always UCI in this contract. Empty `moves` still means `format: "uci"`
   * (no converted segment yet).
   */
  format: "uci";
  normalizationStatus: SolutionNormalizationStatus;
  /** Populated when normalization stopped early or could not start meaningfully. */
  normalizationIssues?: string[];
}

export interface ExerciseSource {
  sourceType: "csv" | "manual" | "lichess" | "mixed";
  importedTitle?: string;
  importedMovePosition?: string;
}

export interface ExerciseVerification {
  status: ExerciseStatus;
  reasons: string[];
  developerNotes?: string;
  /** Human notes from manual override / review (distinct from pipeline `developerNotes`). */
  manualReviewNotes?: string;
  /** ISO 8601 timestamp of last verification pass. */
  lastVerifiedAt?: string;
}

/**
 * One exercise in the normalized dataset artifact (e.g. generated JSON).
 * Keep fields additive across pipeline versions where possible.
 */
export interface ExerciseRecord {
  id: string;
  exerciseNumber: number;
  difficulty: ExerciseDifficulty;
  title: string;
  section?: string;
  fen: string;
  sideToMove: "w" | "b";
  solution: ExerciseSolution;
  source: ExerciseSource;
  verification: ExerciseVerification;
}
