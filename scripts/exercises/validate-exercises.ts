/**
 * Static validation for normalized exercise contract JSON (developer visibility only).
 * Always exits 0. Writes `exercise.validation-report.json`.
 *
 * Usage:
 *   pnpm run exercises:validate
 *   pnpm exec tsx scripts/exercises/validate-exercises.ts --input path/to/exercise.contract.json
 */

import * as fs from "fs";
import * as path from "path";
import { Chess } from "chess.js";
import type {
  ExerciseRecord,
  ExerciseSolution,
} from "../../src/domain/training/types/exercise-record";
import { playUciOnChess } from "./move-uci-normalize";

export const DEFAULT_CONTRACT_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.contract.json"
);

export const DEFAULT_VALIDATION_REPORT_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.validation-report.json"
);

/** Flags used in the validation report (deterministic checks only). */
export type ExerciseValidationFlag =
  | "invalid_fen"
  | "side_to_move_mismatch"
  | "missing_title"
  | "missing_solution"
  | "illegal_first_move"
  | "illegal_line"
  | "duplicate_id"
  | "missing_fen"
  /** Stored UCI prefix is legal; tail of raw SAN tokens did not convert (manual_review tier). */
  | "solution_normalization_partial"
  /** No UCI produced or normalization marked failed; do not treat as illegal SAN line. */
  | "solution_normalization_failed";

export interface ExerciseValidationEntry {
  id: string;
  flags: ExerciseValidationFlag[];
}

export interface ExerciseValidationReport {
  schemaVersion: 1;
  generatedAt: string;
  sourceContractPath: string;
  /** Human-readable caveats for this validator version. */
  limitations: string[];
  totalExercises: number;
  passedCount: number;
  flaggedCount: number;
  exercises: ExerciseValidationEntry[];
  /** Set when the contract file could not be read (report still written). */
  contractReadError?: string;
}

const LIMITATIONS: string[] = [
  "Contract `schemaVersion` 3: `solution.rawMoves` = editorial/import tokens; `solution.moves` + `format: \"uci\"` = machine UCI from normalize. Validation replays `solution.moves` when `normalizationStatus` allows.",
  "When `solution_normalization_failed` is set, the validator does not replay raw SAN (avoids treating notation ambiguity as illegal_line).",
  "When `solution_normalization_partial` is set, the stored UCI prefix replayed cleanly; remaining raw tokens need manual review or import fixes.",
  "Legacy rows: nested `solution.normalization.status` (v2) or SAN-only `solution.moves` without `rawMoves` are still accepted at runtime.",
  "Move-line checks are skipped when FEN is invalid, missing, or when sideToMove does not match the FEN active color (avoids noisy false illegal_* flags).",
];

function parseArgs(argv: string[]): { input: string; output: string } {
  let input = DEFAULT_CONTRACT_PATH;
  let output = DEFAULT_VALIDATION_REPORT_PATH;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if ((a === "--input" || a === "-i") && argv[i + 1]) {
      input = path.resolve(process.cwd(), argv[++i]);
    } else if ((a === "--output" || a === "-o") && argv[i + 1]) {
      output = path.resolve(process.cwd(), argv[++i]);
    }
  }
  return { input, output };
}

function loadRecords(filePath: string): {
  records: ExerciseRecord[];
  error?: string;
} {
  if (!fs.existsSync(filePath)) {
    return {
      records: [],
      error: `Contract file not found: ${filePath}`,
    };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
    if (Array.isArray(raw)) {
      return { records: raw as ExerciseRecord[] };
    }
    if (
      raw &&
      typeof raw === "object" &&
      "records" in raw &&
      Array.isArray((raw as { records: unknown }).records)
    ) {
      return { records: (raw as { records: ExerciseRecord[] }).records };
    }
    return {
      records: [],
      error: "Contract JSON must be an array or an object with a `records` array.",
    };
  } catch (e) {
    return {
      records: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function countDuplicateIds(records: ExerciseRecord[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of records) {
    const id = typeof r.id === "string" ? r.id : "";
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/**
 * Read pipeline solution fields from current (`normalizationStatus`) or legacy v2 (`normalization.status`) JSON.
 */
function getPipelineSolutionState(sol: unknown): {
  rawMoves: string[];
  uciMoves: string[];
  normalizationStatus: string;
} | null {
  if (typeof sol !== "object" || sol === null) return null;
  const o = sol as Record<string, unknown>;
  if (!Array.isArray(o.rawMoves) || !Array.isArray(o.moves)) return null;

  if (typeof o.normalizationStatus === "string") {
    return {
      rawMoves: o.rawMoves as string[],
      uciMoves: o.moves as string[],
      normalizationStatus: o.normalizationStatus,
    };
  }

  const n = o.normalization;
  if (typeof n === "object" && n !== null && typeof (n as { status?: unknown }).status === "string") {
    return {
      rawMoves: o.rawMoves as string[],
      uciMoves: o.moves as string[],
      normalizationStatus: (n as { status: string }).status,
    };
  }

  return null;
}

function isPipelineSolutionShape(s: unknown): s is ExerciseSolution {
  return getPipelineSolutionState(s) !== null;
}

/**
 * Replay stored UCI moves from the starting FEN.
 * Precondition: FEN is valid; caller gates on side / invalid FEN flags.
 */
function validateUciSequence(
  fen: string,
  uciMoves: string[]
): ExerciseValidationFlag[] {
  const flags: ExerciseValidationFlag[] = [];
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return flags;
  }

  for (let i = 0; i < uciMoves.length; i++) {
    const uci = uciMoves[i]?.trim() ?? "";
    if (uci === "") {
      flags.push(i === 0 ? "illegal_first_move" : "illegal_line");
      break;
    }
    const made = playUciOnChess(chess, uci);
    if (made === null) {
      flags.push(i === 0 ? "illegal_first_move" : "illegal_line");
      break;
    }
  }
  return flags;
}

/**
 * Legacy: play solution tokens as SAN (sloppy).
 * Precondition: FEN is valid and `chess.turn() === sideToMove` matches record (caller skips otherwise).
 */
function validateSanSequence(
  fen: string,
  moves: string[]
): ExerciseValidationFlag[] {
  const flags: ExerciseValidationFlag[] = [];
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return flags;
  }

  for (let i = 0; i < moves.length; i++) {
    const token = moves[i]?.trim() ?? "";
    if (token === "") {
      flags.push(i === 0 ? "illegal_first_move" : "illegal_line");
      break;
    }
    let made: ReturnType<Chess["move"]> = null;
    try {
      made = chess.move(token, { sloppy: true });
    } catch {
      made = null;
    }
    if (made === null) {
      flags.push(i === 0 ? "illegal_first_move" : "illegal_line");
      break;
    }
  }
  return flags;
}

function validateOneExercise(
  record: ExerciseRecord,
  idCounts: Map<string, number>
): ExerciseValidationEntry {
  const flags: ExerciseValidationFlag[] = [];

  const id = typeof record.id === "string" ? record.id.trim() : "";
  if (id === "") {
    /* No dedicated flag in spec; surface via structural checks only. */
  } else if ((idCounts.get(record.id) ?? 0) > 1) {
    flags.push("duplicate_id");
  }

  const title =
    typeof record.title === "string" ? record.title.trim() : "";
  if (title === "") {
    flags.push("missing_title");
  }

  const fenRaw = typeof record.fen === "string" ? record.fen.trim() : "";
  if (fenRaw === "") {
    flags.push("missing_fen");
  }

  let chess: Chess | null = null;
  if (fenRaw !== "") {
    try {
      chess = new Chess(fenRaw);
    } catch {
      flags.push("invalid_fen");
      chess = null;
    }
  }

  const side = record.sideToMove;
  const sideOk = side === "w" || side === "b";
  if (chess != null && sideOk && chess.turn() !== side) {
    flags.push("side_to_move_mismatch");
  }

  const sol = record.solution;

  const canTryLine =
    chess != null &&
    !flags.includes("invalid_fen") &&
    !flags.includes("missing_fen") &&
    !flags.includes("side_to_move_mismatch") &&
    sideOk;

  if (!sol) {
    flags.push("missing_solution");
  } else if (isPipelineSolutionShape(sol)) {
    const pipe = getPipelineSolutionState(sol)!;
    const rawOk = pipe.rawMoves.length > 0;
    if (!rawOk) {
      flags.push("missing_solution");
    } else if (
      pipe.normalizationStatus === "failed" ||
      pipe.normalizationStatus === "not_started" ||
      pipe.uciMoves.length === 0
    ) {
      flags.push("solution_normalization_failed");
    } else if (canTryLine) {
      flags.push(...validateUciSequence(fenRaw, pipe.uciMoves));
      const lineBroken =
        flags.includes("illegal_first_move") || flags.includes("illegal_line");
      if (!lineBroken && pipe.normalizationStatus === "partial") {
        flags.push("solution_normalization_partial");
      }
    } else if (pipe.normalizationStatus === "partial") {
      flags.push("solution_normalization_partial");
    }
  } else {
    const moves = "moves" in sol ? (sol as { moves?: string[] }).moves : undefined;
    const hasMoves = Array.isArray(moves) && moves.length > 0;
    if (!hasMoves) {
      flags.push("missing_solution");
    }
    if (canTryLine && hasMoves && moves) {
      flags.push(...validateSanSequence(fenRaw, moves));
    }
  }

  return { id: id || "(no id)", flags };
}

function writeReport(outputPath: string, report: ExerciseValidationReport): void {
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf-8"
  );
}

function main(): void {
  const { input, output } = parseArgs(process.argv);
  const relContract = path.relative(process.cwd(), input) || input;
  const generatedAt = new Date().toISOString();

  const { records, error } = loadRecords(input);

  if (error) {
    const report: ExerciseValidationReport = {
      schemaVersion: 1,
      generatedAt,
      sourceContractPath: relContract,
      limitations: LIMITATIONS,
      totalExercises: 0,
      passedCount: 0,
      flaggedCount: 0,
      exercises: [],
      contractReadError: error,
    };
    writeReport(output, report);
    console.warn("[exercises:validate]", error);
    console.log("Wrote report →", output);
    return;
  }

  const idCounts = countDuplicateIds(records);
  const exercises = records.map((r) => validateOneExercise(r, idCounts));

  const flaggedCount = exercises.filter((e) => e.flags.length > 0).length;
  const passedCount = exercises.length - flaggedCount;

  const report: ExerciseValidationReport = {
    schemaVersion: 1,
    generatedAt,
    sourceContractPath: relContract,
    limitations: LIMITATIONS,
    totalExercises: records.length,
    passedCount,
    flaggedCount,
    exercises,
  };

  writeReport(output, report);
  console.log(
    `[exercises:validate] ${passedCount} passed, ${flaggedCount} flagged (of ${records.length}) → ${output}`
  );
}

main();
