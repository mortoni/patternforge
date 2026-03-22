/**
 * Row → {@link ExerciseRecord} for the exercise dataset pipeline.
 *
 * ## Current repo CSV (`data/imports/puzzle.csv`)
 * Headers: `trainingSetId`, `puzzleNumber`, `fen`, `sideToMove`, `solutionMoves`,
 * `motifTags`, `gameSource`, `difficulty`, `comment`
 *
 * ## Aliases (same row may use catalog-style names)
 * | Contract intent   | CSV keys tried (first non-empty wins) |
 * |-------------------|----------------------------------------|
 * | section           | `section`, `trainingSetId`            |
 * | exercise number   | `exercise_number`, `puzzleNumber`, …   |
 * | title             | `title`, `gameSource`                  |
 * | fen               | `fen`                                  |
 * | solution line     | `solution`, `raw_solution`, `solutionMoves`, … |
 * | move_position     | `move_position` (optional)           |
 * | comment           | `comment`                              |
 * | difficulty        | `difficulty`                           |
 * | motifTags         | `motifTags`, `motif_tags`              |
 *
 * ## Solution moves
 * Imported tokens are split on whitespace into `rawMoves`. True UCI is produced by
 * `buildSolutionWithUciNormalization` in `move-uci-normalize.ts` (chess.js replay).
 */

import type {
  ExerciseDifficulty,
  ExerciseRecord,
  SolutionNormalizationStatus,
} from "../../src/domain/training/types/exercise-record";
import { buildSolutionWithUciNormalization } from "./move-uci-normalize";

/** First matching key in `row` with a non-empty trimmed value. */
function pickField(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    if (key in row) {
      const v = row[key]?.trim() ?? "";
      if (v !== "") return v;
    }
  }
  return "";
}

/** Trim every cell so sparse / whitespace-only rows behave consistently. */
export function trimCsvRow(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = typeof v === "string" ? v.trim() : String(v).trim();
  }
  return out;
}

export type RowIssueLevel = "error" | "warning";

export interface RowIssue {
  level: RowIssueLevel;
  message: string;
}

export interface RowMoveNormalizationSummary {
  normalizationStatus: SolutionNormalizationStatus;
  normalizationIssues?: string[];
  rawTokenCount: number;
  uciMoveCount: number;
}

export interface RowNormalizationEntry {
  csvRowNumber: number;
  mapped: boolean;
  exerciseId?: string;
  issues: RowIssue[];
  /** Present when the row was mapped and move normalization ran. */
  moveNormalization?: RowMoveNormalizationSummary;
}

export interface NormalizationReport {
  schemaVersion: 3;
  generatedAt: string;
  sourceCsvPath: string;
  totalRows: number;
  mappedRows: number;
  skippedRows: number;
  /** Rows with at least one error or warning (mapped or not). */
  rowsWithIssues: number;
  fullyNormalizedRows: number;
  partiallyNormalizedRows: number;
  failedNormalizationRows: number;
  entries: RowNormalizationEntry[];
}

/**
 * Stable pipeline id: `exercise-0001`, … for **successfully mapped** rows (1-based among mapped only).
 */
export function deriveExerciseId(mappedIndex1Based: number): string {
  return `exercise-${String(mappedIndex1Based).padStart(4, "0")}`;
}

/**
 * Active side from FEN (field 2). Returns `null` if not readable.
 */
export function deriveSideToMoveFromFen(fen: string): "w" | "b" | null {
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const side = parts[1];
  if (side === "w" || side === "b") return side;
  return null;
}

/**
 * Split solution line into ordered move tokens (whitespace).
 */
export function normalizeSolutionMoves(solutionLine: string): string[] {
  return solutionLine
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseExerciseNumber(
  raw: string,
  fallback: number
): { value: number; issues: RowIssue[] } {
  const issues: RowIssue[] = [];
  if (raw === "") {
    issues.push({
      level: "warning",
      message: `Missing exercise number; using fallback ${fallback}.`,
    });
    return { value: fallback, issues };
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    issues.push({
      level: "warning",
      message: `Invalid exercise number "${raw}"; using fallback ${fallback}.`,
    });
    return { value: fallback, issues };
  }
  return { value: n, issues };
}

function mapDifficultyString(raw: string): {
  value: ExerciseDifficulty;
  issues: RowIssue[];
} {
  const issues: RowIssue[] = [];
  const d = raw.trim().toLowerCase();
  if (d === "easy") return { value: "easy", issues };
  if (d === "medium" || d === "intermediate") return { value: "medium", issues };
  if (d === "hard" || d === "advanced") return { value: "hard", issues };
  if (d === "custom" || d === "") {
    if (d === "")
      issues.push({
        level: "warning",
        message: "Empty difficulty; defaulting to medium.",
      });
    else
      issues.push({
        level: "warning",
        message: `Difficulty "${raw}" mapped to medium.`,
      });
    return { value: "medium", issues };
  }
  issues.push({
    level: "warning",
    message: `Unknown difficulty "${raw}"; defaulting to medium.`,
  });
  return { value: "medium", issues };
}

/** Body without pipeline `id` (assigned after a row is accepted into the output list). */
export type ExerciseRecordBody = Omit<ExerciseRecord, "id">;

export interface MapRawRowResult {
  record: ExerciseRecordBody | null;
  entry: RowNormalizationEntry;
}

/**
 * Map one trimmed CSV object row to an {@link ExerciseRecord} when possible.
 * Collects all issues; returns `record: null` only when blocking errors exist.
 */
export interface MapRawRowContext {
  csvRowNumber: number;
  /** 1-based index of this row among data rows (used if exercise # missing). */
  dataRowIndex1Based: number;
}

export function mapRawCsvRowToExerciseRecord(
  raw: Record<string, string>,
  ctx: MapRawRowContext
): MapRawRowResult {
  const issues: RowIssue[] = [];

  const section =
    pickField(raw, ["section", "trainingSetId", "set_id"]) || "";
  if (section === "") {
    issues.push({
      level: "warning",
      message: "Missing section (trainingSetId); using placeholder.",
    });
  }
  const sectionFinal = section || "unknown";

  const numRaw = pickField(raw, [
    "exercise_number",
    "puzzleNumber",
    "puzzle_number",
  ]);
  const { value: exerciseNumber, issues: numIssues } = parseExerciseNumber(
    numRaw,
    ctx.dataRowIndex1Based
  );
  issues.push(...numIssues);

  const fen = pickField(raw, ["fen"]);
  if (fen === "") {
    issues.push({ level: "error", message: "Missing required field: fen." });
  }

  const solutionLine = pickField(raw, [
    "solution",
    "raw_solution",
    "solutionMoves",
    "solution_moves",
  ]);
  const rawTokens = normalizeSolutionMoves(solutionLine);
  if (rawTokens.length === 0) {
    issues.push({
      level: "error",
      message:
        "Missing or empty solution (tried solution, raw_solution, solutionMoves, solution_moves).",
    });
  }

  const sideToMove = deriveSideToMoveFromFen(fen);
  if (sideToMove == null && fen !== "") {
    issues.push({
      level: "error",
      message: "Could not derive sideToMove from FEN (expected active color in field 2).",
    });
  }

  const csvSide = pickField(raw, ["sideToMove", "side_to_move"]).toLowerCase();
  if (
    csvSide &&
    (csvSide === "w" || csvSide === "b") &&
    sideToMove != null &&
    csvSide !== sideToMove
  ) {
    issues.push({
      level: "warning",
      message: `CSV sideToMove (${csvSide}) differs from FEN active color (${sideToMove}); using FEN.`,
    });
  }

  const titleRaw = pickField(raw, ["title", "gameSource", "game_source"]);
  const title =
    titleRaw !== ""
      ? titleRaw
      : `Exercise ${exerciseNumber} (${sectionFinal})`;

  const diffRaw = pickField(raw, ["difficulty"]);
  const { value: difficulty, issues: diffIssues } = mapDifficultyString(
    diffRaw === "" ? "" : diffRaw
  );
  issues.push(...diffIssues);

  const comment = pickField(raw, ["comment"]);
  const movePosition = pickField(raw, ["move_position"]);
  const motifLine = pickField(raw, ["motifTags", "motif_tags"]);

  const blocking = issues.some((i) => i.level === "error");
  if (blocking || fen === "" || rawTokens.length === 0 || sideToMove == null) {
    return {
      record: null,
      entry: {
        csvRowNumber: ctx.csvRowNumber,
        mapped: false,
        issues,
      },
    };
  }

  const devParts: string[] = [];
  if (motifLine) devParts.push(`motifTags: ${motifLine}`);
  if (comment) devParts.push(comment);

  const solution = buildSolutionWithUciNormalization(rawTokens, fen);

  const record: ExerciseRecordBody = {
    exerciseNumber,
    difficulty,
    title,
    section: sectionFinal,
    fen,
    sideToMove,
    solution,
    source: {
      sourceType: "csv",
      importedTitle: titleRaw || undefined,
      importedMovePosition: movePosition || undefined,
    },
    verification: {
      status: "pending",
      reasons: [],
      ...(devParts.length ? { developerNotes: devParts.join(" | ") } : {}),
    },
  };

  return {
    record,
    entry: {
      csvRowNumber: ctx.csvRowNumber,
      mapped: true,
      issues,
      moveNormalization: {
        normalizationStatus: solution.normalizationStatus,
        ...(solution.normalizationIssues?.length
          ? { normalizationIssues: [...solution.normalizationIssues] }
          : {}),
        rawTokenCount: solution.rawMoves.length,
        uciMoveCount: solution.moves.length,
      },
    },
  };
}

function aggregateMoveNormalization(entries: RowNormalizationEntry[]): {
  fullyNormalizedRows: number;
  partiallyNormalizedRows: number;
  failedNormalizationRows: number;
} {
  let fullyNormalizedRows = 0;
  let partiallyNormalizedRows = 0;
  let failedNormalizationRows = 0;
  for (const e of entries) {
    if (!e.mapped || !e.moveNormalization) continue;
    switch (e.moveNormalization.normalizationStatus) {
      case "normalized":
        fullyNormalizedRows += 1;
        break;
      case "partial":
        partiallyNormalizedRows += 1;
        break;
      case "failed":
        failedNormalizationRows += 1;
        break;
      default:
        break;
    }
  }
  return {
    fullyNormalizedRows,
    partiallyNormalizedRows,
    failedNormalizationRows,
  };
}

export function buildNormalizationReport(
  sourceCsvPath: string,
  totalRows: number,
  entries: RowNormalizationEntry[],
  generatedAt: string
): NormalizationReport {
  const mappedRows = entries.filter((e) => e.mapped).length;
  const rowsWithIssues = entries.filter((e) => e.issues.length > 0).length;
  const counts = aggregateMoveNormalization(entries);
  return {
    schemaVersion: 3,
    generatedAt,
    sourceCsvPath,
    totalRows,
    mappedRows,
    skippedRows: totalRows - mappedRows,
    rowsWithIssues,
    ...counts,
    entries,
  };
}
