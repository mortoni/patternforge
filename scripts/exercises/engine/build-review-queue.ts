/**
 * Build a developer review queue from the first-move engine report + verified exercises.
 *
 * - Inputs: `exercise.engine-report.json`, `exercise.verified.json`
 * - Output: `exercise.engine-review-queue.json` + `.csv`
 * - Always exits 0 (developer-only).
 *
 * Usage:
 *   pnpm run exercises:engine:review-queue
 *   pnpm exec tsx scripts/exercises/engine/build-review-queue.ts --engine path --verified path
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ExerciseRecord } from "../../../src/domain/training/types/exercise-record";

export const DEFAULT_ENGINE_REPORT_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.engine-report.json"
);

export const DEFAULT_VERIFIED_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.verified.json"
);

export const DEFAULT_QUEUE_JSON_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.engine-review-queue.json"
);

export const DEFAULT_QUEUE_CSV_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.engine-review-queue.csv"
);

/** Minimal engine report shape (avoid importing validate-first-move → stockfish). */
interface EngineReportJson {
  schemaVersion?: number;
  generatedAt?: string;
  sourcePath?: string;
  exercises?: EngineRow[];
  readError?: string;
}

interface EngineRow {
  exerciseId: string;
  expectedMove: string;
  bestMove: string;
  evaluation: { type: "cp" | "mate"; value: number } | null;
  classification: string;
}

export interface EngineReviewQueueItem {
  exerciseId: string;
  exerciseNumber: number | null;
  title: string | null;
  section: string | null;
  fen: string | null;
  expectedMove: string;
  bestMove: string;
  evaluation: { type: "cp" | "mate"; value: number } | null;
  classification: string;
  solution: {
    rawMoves: string[];
    moves: string[];
    normalizationStatus?: string;
    normalizationIssues?: string[];
  };
  source: ExerciseRecord["source"] | null;
  verification: ExerciseRecord["verification"] | null;
  /** No matching `exercise.verified.json` row for this id. */
  joinMissing: boolean;
}

export interface EngineReviewQueueReport {
  schemaVersion: 1;
  generatedAt: string;
  sourceEngineReportPath: string;
  sourceVerifiedPath: string;
  summary: {
    totalSuspicious: number;
    queueLength: number;
    joinMissingCount: number;
  };
  queue: EngineReviewQueueItem[];
  /** Present when the engine report could not be read. */
  readError?: string;
}

interface VerifiedEnvelope {
  records?: ExerciseRecord[];
}

function parseArgs(argv: string[]): {
  engineReport: string;
  verified: string;
  outJson: string;
  outCsv: string;
} {
  let engineReport = DEFAULT_ENGINE_REPORT_PATH;
  let verified = DEFAULT_VERIFIED_PATH;
  let outJson = DEFAULT_QUEUE_JSON_PATH;
  let outCsv = DEFAULT_QUEUE_CSV_PATH;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if ((a === "--engine" || a === "-e") && argv[i + 1]) {
      engineReport = path.resolve(process.cwd(), argv[++i]);
    } else if ((a === "--verified" || a === "-v") && argv[i + 1]) {
      verified = path.resolve(process.cwd(), argv[++i]);
    } else if ((a === "--out-json" || a === "-j") && argv[i + 1]) {
      outJson = path.resolve(process.cwd(), argv[++i]);
    } else if ((a === "--out-csv" || a === "-c") && argv[i + 1]) {
      outCsv = path.resolve(process.cwd(), argv[++i]);
    }
  }
  return { engineReport, verified, outJson, outCsv };
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function buildVerifiedById(verifiedPath: string): Map<string, ExerciseRecord> {
  const raw = readJsonFile<VerifiedEnvelope>(verifiedPath);
  const map = new Map<string, ExerciseRecord>();
  if (!raw?.records) return map;
  for (const r of raw.records) {
    if (typeof r.id === "string" && r.id) {
      map.set(r.id, r);
    }
  }
  return map;
}

function sortQueue(items: EngineReviewQueueItem[]): EngineReviewQueueItem[] {
  const rank = (c: string) => (c === "engine_suspicious" ? 0 : 1);
  return [...items].sort((a, b) => {
    const rc = rank(a.classification) - rank(b.classification);
    if (rc !== 0) return rc;
    const na = a.exerciseNumber ?? Number.MAX_SAFE_INTEGER;
    const nb = b.exerciseNumber ?? Number.MAX_SAFE_INTEGER;
    return na - nb;
  });
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCsvLine(item: EngineReviewQueueItem): string {
  const cells = [
    item.exerciseId,
    String(item.exerciseNumber ?? ""),
    item.title ?? "",
    item.section ?? "",
    item.fen ?? "",
    item.expectedMove,
    item.bestMove,
    item.evaluation?.type ?? "",
    item.evaluation != null ? String(item.evaluation.value) : "",
    item.classification,
    JSON.stringify(item.solution.rawMoves),
    JSON.stringify(item.solution.moves),
    item.solution.normalizationStatus ?? "",
    item.solution.normalizationIssues?.length
      ? JSON.stringify(item.solution.normalizationIssues)
      : "",
    item.source?.sourceType ?? "",
    item.source?.importedTitle ?? "",
    item.source?.importedMovePosition ?? "",
    item.verification?.status ?? "",
    item.verification?.reasons?.length
      ? JSON.stringify(item.verification.reasons)
      : "",
    item.verification?.developerNotes ?? "",
    item.verification?.lastVerifiedAt ?? "",
    item.joinMissing ? "yes" : "no",
  ];
  return cells.map(escapeCsvCell).join(",");
}

const CSV_HEADER = [
  "exerciseId",
  "exerciseNumber",
  "title",
  "section",
  "fen",
  "expectedMove",
  "bestMove",
  "evaluationType",
  "evaluationValue",
  "classification",
  "solutionRawMovesJson",
  "solutionMovesJson",
  "normalizationStatus",
  "normalizationIssuesJson",
  "sourceType",
  "importedTitle",
  "importedMovePosition",
  "verificationStatus",
  "verificationReasonsJson",
  "verificationDeveloperNotes",
  "verificationLastVerifiedAt",
  "joinMissing",
].join(",");

export function buildQueueItems(
  engineRows: EngineRow[],
  byId: Map<string, ExerciseRecord>
): EngineReviewQueueItem[] {
  const suspicious = engineRows.filter(
    (r) => r.classification === "engine_suspicious"
  );
  const items: EngineReviewQueueItem[] = [];

  for (const row of suspicious) {
    const rec = byId.get(row.exerciseId) ?? null;
    const joinMissing = rec == null;

    const solution = rec?.solution;
    items.push({
      exerciseId: row.exerciseId,
      exerciseNumber: rec?.exerciseNumber ?? null,
      title: rec?.title ?? null,
      section: rec?.section ?? null,
      fen: rec?.fen ?? null,
      expectedMove: row.expectedMove,
      bestMove: row.bestMove,
      evaluation: row.evaluation,
      classification: row.classification,
      solution: {
        rawMoves: solution?.rawMoves ? [...solution.rawMoves] : [],
        moves: solution?.moves ? [...solution.moves] : [],
        ...(solution?.normalizationStatus != null
          ? { normalizationStatus: solution.normalizationStatus }
          : {}),
        ...(solution?.normalizationIssues?.length
          ? { normalizationIssues: [...solution.normalizationIssues] }
          : {}),
      },
      source: rec?.source ?? null,
      verification: rec?.verification ?? null,
      joinMissing,
    });
  }

  return sortQueue(items);
}

function writeOutputs(
  outJson: string,
  outCsv: string,
  report: EngineReviewQueueReport
): void {
  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.mkdirSync(path.dirname(outCsv), { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  const csvBody = report.queue.map(rowToCsvLine).join("\n");
  fs.writeFileSync(
    outCsv,
    `${CSV_HEADER}\n${csvBody}${csvBody ? "\n" : ""}`,
    "utf-8"
  );
}

function main(): void {
  const { engineReport, verified, outJson, outCsv } = parseArgs(process.argv);
  const generatedAt = new Date().toISOString();
  const relEngine = path.relative(process.cwd(), engineReport) || engineReport;
  const relVerified = path.relative(process.cwd(), verified) || verified;

  const engineParsed = readJsonFile<EngineReportJson>(engineReport);
  const exercises = engineParsed?.exercises ?? [];

  if (!engineParsed || engineParsed.readError) {
    const report: EngineReviewQueueReport = {
      schemaVersion: 1,
      generatedAt,
      sourceEngineReportPath: relEngine,
      sourceVerifiedPath: relVerified,
      summary: {
        totalSuspicious: 0,
        queueLength: 0,
        joinMissingCount: 0,
      },
      queue: [],
      readError:
        engineParsed?.readError ??
        (!fs.existsSync(engineReport)
          ? `Engine report not found: ${relEngine}`
          : "Could not parse engine report JSON."),
    };
    writeOutputs(outJson, outCsv, report);
    console.warn("[exercises:engine:review-queue]", report.readError);
    const j = path.relative(process.cwd(), outJson) || outJson;
    const c = path.relative(process.cwd(), outCsv) || outCsv;
    console.log(`JSON → ${j}\nCSV  → ${c}`);
    return;
  }

  const byId = buildVerifiedById(verified);
  const queue = buildQueueItems(exercises, byId);
  const totalSuspicious = exercises.filter(
    (r) => r.classification === "engine_suspicious"
  ).length;
  const joinMissingCount = queue.filter((q) => q.joinMissing).length;

  const report: EngineReviewQueueReport = {
    schemaVersion: 1,
    generatedAt,
    sourceEngineReportPath: relEngine,
    sourceVerifiedPath: relVerified,
    summary: {
      totalSuspicious,
      queueLength: queue.length,
      joinMissingCount,
    },
    queue,
  };

  writeOutputs(outJson, outCsv, report);

  const j = path.relative(process.cwd(), outJson) || outJson;
  const c = path.relative(process.cwd(), outCsv) || outCsv;
  console.log(
    `[exercises:engine:review-queue] suspicious=${totalSuspicious} queue=${queue.length} joinMissing=${joinMissingCount}`
  );
  console.log(`JSON → ${j}`);
  console.log(`CSV  → ${c}`);
}

main();
