/**
 * Engine check: compare the first normalized UCI move to Stockfish's best move.
 *
 * - Input: `exercise.verified.json` (certified exercises only).
 * - Only processes rows with `solution.normalizationStatus === "normalized"`.
 * - Always exits 0 (developer-only; does not gate CI).
 * - Book / CSV moves remain authoritative; Stockfish is a confidence signal only.
 *
 * Prerequisites: `stockfish` on PATH; run certify so `exercise.verified.json` exists.
 *
 * Usage:
 *   pnpm run exercises:engine:validate
 *   pnpm run exercises:engine:validate-suspicious
 *   pnpm exec tsx scripts/exercises/engine/validate-first-move.ts --input path/to/exercise.verified.json
 *
 * Analysis tuning (defaults in `engine/stockfish-config.ts`):
 *   --depth 20 --movetime 8000 --hash 256 --threads 4
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ExerciseRecord } from "../../../src/domain/training/types/exercise-record";
import { analyzePosition, type AnalyzePositionResult } from "./stockfish";
import {
  buildStockfishGoCommand,
  formatStockfishConfigSummary,
  mergeStockfishConfig,
  type StockfishAnalysisConfig,
} from "./stockfish-config";

export const DEFAULT_VERIFIED_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.verified.json"
);

export const DEFAULT_ENGINE_REPORT_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.engine-report.json"
);

/** Reserved for future heuristics; currently only match / suspicious / rejected are emitted. */
export type EngineFirstMoveClassification =
  | "engine_match"
  | "engine_close"
  | "engine_suspicious"
  | "engine_rejected";

export interface EngineFirstMoveEntry {
  exerciseId: string;
  expectedMove: string;
  bestMove: string;
  evaluation: AnalyzePositionResult["evaluation"] | null;
  classification: EngineFirstMoveClassification;
}

export interface EngineFirstMoveReport {
  schemaVersion: 2;
  generatedAt: string;
  sourcePath: string;
  /** Snapshot of UCI analysis settings (reproducibility). */
  stockfishSettings: StockfishAnalysisConfig;
  /** Same as `stockfishSettings.depth`; kept for quick scanning / older tooling. */
  stockfishDepth: number;
  summary: {
    totalChecked: number;
    matches: number;
    /** Non-exact first move vs engine, including `engine_rejected` (Stockfish errors). */
    suspicious: number;
    skipped: number;
    /** Rows re-analyzed with Stockfish (`stockfishRuns` equals `totalChecked` on a full run). */
    stockfishRuns: number;
  };
  exercises: EngineFirstMoveEntry[];
  /** When the verified file could not be read (report still written). */
  readError?: string;
  /** When `--suspicious-only` was used, path to the prior engine report merged from. */
  priorReportPath?: string;
}

interface VerifiedEnvelope {
  records?: ExerciseRecord[];
}

interface ParseArgsResult {
  input: string;
  output: string;
  suspiciousOnly: boolean;
  priorReport: string;
  stockfish: Partial<StockfishAnalysisConfig>;
}

function parseArgs(argv: string[]): ParseArgsResult {
  let input = DEFAULT_VERIFIED_PATH;
  let output = DEFAULT_ENGINE_REPORT_PATH;
  let suspiciousOnly = false;
  let priorReport = DEFAULT_ENGINE_REPORT_PATH;
  const stockfish: Partial<StockfishAnalysisConfig> = {};

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if ((a === "--input" || a === "-i") && argv[i + 1]) {
      input = path.resolve(process.cwd(), argv[++i]);
    } else if ((a === "--output" || a === "-o") && argv[i + 1]) {
      output = path.resolve(process.cwd(), argv[++i]);
    } else if ((a === "--depth" || a === "-d") && argv[i + 1]) {
      stockfish.depth = Math.max(1, Number.parseInt(argv[++i], 10) || 1);
    } else if (a === "--movetime" && argv[i + 1]) {
      const ms = Number.parseInt(argv[++i], 10);
      if (Number.isFinite(ms) && ms > 0) {
        stockfish.movetimeMs = ms;
      }
    } else if (a === "--hash" && argv[i + 1]) {
      stockfish.hashMb = Math.max(1, Number.parseInt(argv[++i], 10) || 1);
    } else if (a === "--threads" && argv[i + 1]) {
      stockfish.threads = Math.max(1, Number.parseInt(argv[++i], 10) || 1);
    } else if (a === "--timeout" && argv[i + 1]) {
      stockfish.timeoutMsPerPosition = Math.max(
        1000,
        Number.parseInt(argv[++i], 10) || 1000
      );
    } else if (a === "--suspicious-only") {
      suspiciousOnly = true;
    } else if (a === "--prior-report" && argv[i + 1]) {
      priorReport = path.resolve(process.cwd(), argv[++i]);
    }
  }
  return { input, output, suspiciousOnly, priorReport, stockfish };
}

function uciEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function loadVerified(filePath: string): {
  records: ExerciseRecord[];
  relPath: string;
  error?: string;
} {
  const relPath = path.relative(process.cwd(), filePath) || filePath;
  if (!fs.existsSync(filePath)) {
    return {
      records: [],
      relPath,
      error: `Verified file not found: ${filePath}`,
    };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as VerifiedEnvelope;
    const records = Array.isArray(raw.records) ? raw.records : [];
    return { records, relPath };
  } catch (e) {
    return {
      records: [],
      relPath,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function loadPriorEngineReport(filePath: string): EngineFirstMoveReport | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
    if (
      !raw ||
      typeof raw !== "object" ||
      !Array.isArray((raw as EngineFirstMoveReport).exercises)
    ) {
      return null;
    }
    return raw as EngineFirstMoveReport;
  } catch {
    return null;
  }
}

function writeReport(outputPath: string, report: EngineFirstMoveReport): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf-8"
  );
}

function countFromClassification(c: EngineFirstMoveClassification): {
  match: boolean;
  suspicious: boolean;
} {
  if (c === "engine_match") return { match: true, suspicious: false };
  return { match: false, suspicious: true };
}

async function main(): Promise<void> {
  const { input, output, suspiciousOnly, priorReport, stockfish: cliSf } =
    parseArgs(process.argv);
  const stockfishCfg = mergeStockfishConfig(cliSf);
  const generatedAt = new Date().toISOString();
  const { records, relPath, error } = loadVerified(input);

  const goLine = buildStockfishGoCommand(stockfishCfg);
  console.log(
    `[exercises:engine:validate] Stockfish: ${formatStockfishConfigSummary(stockfishCfg)}`
  );
  console.log(
    `[exercises:engine:validate] UCI init: Skill Level=${stockfishCfg.skillLevel}, UCI_LimitStrength=${stockfishCfg.uciLimitStrength}, Hash=${stockfishCfg.hashMb}MB, Threads=${stockfishCfg.threads}`
  );
  console.log(`[exercises:engine:validate] Search: ${goLine}`);

  let priorById = new Map<string, EngineFirstMoveEntry>();
  let priorReportPath: string | undefined;
  let suspiciousOnlyActive = false;

  if (suspiciousOnly) {
    const loaded = loadPriorEngineReport(priorReport);
    if (!loaded) {
      console.warn(
        "[exercises:engine:validate] --suspicious-only: could not load prior report; running full validation.",
        `missing or invalid: ${priorReport}`
      );
    } else {
      suspiciousOnlyActive = true;
      priorReportPath = path.relative(process.cwd(), priorReport) || priorReport;
      for (const ex of loaded.exercises) {
        priorById.set(ex.exerciseId, ex);
      }
      const priorSuspicious = loaded.exercises.filter(
        (e) => e.classification === "engine_suspicious"
      ).length;
      console.log(
        `[exercises:engine:validate] Mode: suspicious-only (prior: ${priorReportPath}, prior suspicious=${priorSuspicious})`
      );
    }
  }

  const exercises: EngineFirstMoveEntry[] = [];
  let matches = 0;
  let suspicious = 0;
  let skipped = 0;
  let stockfishRuns = 0;

  if (error) {
    const report: EngineFirstMoveReport = {
      schemaVersion: 2,
      generatedAt,
      sourcePath: relPath,
      stockfishSettings: stockfishCfg,
      stockfishDepth: stockfishCfg.depth,
      summary: {
        totalChecked: 0,
        matches: 0,
        suspicious: 0,
        skipped: 0,
        stockfishRuns: 0,
      },
      exercises: [],
      readError: error,
    };
    writeReport(output, report);
    console.warn("[exercises:engine:validate]", error);
    console.log(`Wrote report → ${output}`);
    return;
  }

  for (const record of records) {
    const id = typeof record.id === "string" ? record.id : "";
    const sol = record.solution;

    if (sol?.normalizationStatus !== "normalized") {
      skipped += 1;
      continue;
    }

    const expectedMove = sol.moves?.[0]?.trim() ?? "";
    if (!expectedMove) {
      skipped += 1;
      continue;
    }

    const fen = typeof record.fen === "string" ? record.fen.trim() : "";
    if (!fen) {
      skipped += 1;
      continue;
    }

    const rowId = id || "(no id)";

    if (suspiciousOnlyActive) {
      const prev = priorById.get(rowId);
      if (prev && prev.classification !== "engine_suspicious") {
        exercises.push(prev);
        const c = countFromClassification(prev.classification);
        if (c.match) matches += 1;
        if (c.suspicious) suspicious += 1;
        continue;
      }
    }

    stockfishRuns += 1;

    try {
      const analysis = await analyzePosition(fen, stockfishCfg);
      const best = analysis.bestMove.trim();
      const classification: EngineFirstMoveClassification = uciEqual(
        expectedMove,
        best
      )
        ? "engine_match"
        : "engine_suspicious";

      if (classification === "engine_match") matches += 1;
      else suspicious += 1;

      exercises.push({
        exerciseId: rowId,
        expectedMove,
        bestMove: best,
        evaluation: analysis.evaluation,
        classification,
      });
    } catch (e) {
      suspicious += 1;
      exercises.push({
        exerciseId: rowId,
        expectedMove,
        bestMove: "",
        evaluation: null,
        classification: "engine_rejected",
      });
      console.warn(
        `[exercises:engine:validate] ${rowId}:`,
        e instanceof Error ? e.message : e
      );
    }
  }

  const totalChecked = exercises.length;

  const report: EngineFirstMoveReport = {
    schemaVersion: 2,
    generatedAt,
    sourcePath: relPath,
    stockfishSettings: stockfishCfg,
    stockfishDepth: stockfishCfg.depth,
    summary: {
      totalChecked,
      matches,
      suspicious,
      skipped,
      stockfishRuns,
    },
    exercises,
    ...(priorReportPath ? { priorReportPath } : {}),
  };

  writeReport(output, report);

  console.log(
    `[exercises:engine:validate] checked=${totalChecked} stockfishRuns=${stockfishRuns} match=${matches} suspicious=${suspicious} skipped=${skipped} → ${output}`
  );
}

main().catch((e) => {
  console.error("[exercises:engine:validate] fatal:", e);
  process.exitCode = 0;
});
