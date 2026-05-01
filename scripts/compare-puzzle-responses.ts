/**
 * Compare solution move sequences between:
 * - data/imports/puzzle.csv (current source of truth)
 * - data/woodpecker_solution_sequences_all_exercises.csv (newer extraction)
 *
 * Outputs:
 * - console summary
 * - data/reports/puzzle-response-diff.csv
 *
 * Usage:
 *   pnpm compare:puzzle-responses
 */

import * as fs from "fs";
import * as path from "path";
import { parseCsv } from "../src/lib/csv";

const PUZZLE_CSV_PATH = path.join(process.cwd(), "data", "imports", "puzzle.csv");
const WOODPECKER_CSV_PATH = path.join(
  process.cwd(),
  "data",
  "woodpecker_solution_sequences_all_exercises.csv"
);
const REPORT_PATH = path.join(
  process.cwd(),
  "data",
  "reports",
  "puzzle-response-diff.csv"
);

type DiffType =
  | "match"
  | "mismatch"
  | "missing-in-woodpecker"
  | "missing-in-puzzle";

interface DiffRow {
  puzzleId: string;
  type: DiffType;
  puzzleMoves: string;
  woodpeckerMoves: string;
  puzzleMoveCount: number;
  woodpeckerMoveCount: number;
}

function puzzleIdFromPuzzleCsvRow(row: Record<string, string>): string {
  const setId = row.trainingSetId?.trim();
  const num = Number(row.puzzleNumber);
  if (!setId || !Number.isFinite(num)) return "";
  return `${setId}-${String(num).padStart(4, "0")}`;
}

function normalizeMoveToken(raw: string): string {
  return raw
    .trim()
    .normalize("NFKC")
    .replace(/^(\d+)\.(\.\.)?/, "")
    .replace(/^[.…]+/, "")
    .replace(/e\.p\./gi, "")
    .replace(/[£♕♛]/g, "Q")
    .replace(/[¤♘♞]/g, "N")
    .replace(/[¢♔♚]/g, "K")
    .replace(/[¦♖♜]/g, "R")
    .replace(/[¥♗♝]/g, "B")
    .replace(/[!?]+$/g, "")
    .trim();
}

function normalizeMoveList(moves: string[]): string[] {
  return moves.map(normalizeMoveToken).filter(Boolean);
}

function parsePuzzleSolutionMoves(raw: string): string[] {
  return normalizeMoveList((raw ?? "").split(/\s+/).filter(Boolean));
}

function parseWoodpeckerSolutionSequence(raw: string): string[] {
  const value = (raw ?? "").trim();
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return normalizeMoveList(parsed.map((m) => String(m)));
    }
  } catch {
    // fallback below
  }
  try {
    const repaired = value.replace(/""/g, '"');
    const parsed = JSON.parse(repaired);
    if (Array.isArray(parsed)) {
      return normalizeMoveList(parsed.map((m) => String(m)));
    }
  } catch {
    // fallback below
  }
  return normalizeMoveList(
    value
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map((v) => v.replace(/^"+|"+$/g, "").trim())
  );
}

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function writeReport(rows: DiffRow[]) {
  const dir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const lines = [
    "puzzleId,type,puzzleMoveCount,woodpeckerMoveCount,puzzleMoves,woodpeckerMoves",
    ...rows.map((r) =>
      [
        csvEscape(r.puzzleId),
        csvEscape(r.type),
        csvEscape(r.puzzleMoveCount),
        csvEscape(r.woodpeckerMoveCount),
        csvEscape(r.puzzleMoves),
        csvEscape(r.woodpeckerMoves),
      ].join(",")
    ),
  ];
  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf-8");
}

function main() {
  if (!fs.existsSync(PUZZLE_CSV_PATH)) {
    console.error("Missing:", PUZZLE_CSV_PATH);
    process.exit(1);
  }
  if (!fs.existsSync(WOODPECKER_CSV_PATH)) {
    console.error("Missing:", WOODPECKER_CSV_PATH);
    process.exit(1);
  }

  const puzzleRows = parseCsv(fs.readFileSync(PUZZLE_CSV_PATH, "utf-8")).rows;
  const woodpeckerRows = parseCsv(fs.readFileSync(WOODPECKER_CSV_PATH, "utf-8")).rows;

  const puzzleMap = new Map<string, string[]>();
  const woodpeckerMap = new Map<string, string[]>();

  for (const row of puzzleRows) {
    const id = puzzleIdFromPuzzleCsvRow(row);
    if (!id) continue;
    puzzleMap.set(id, parsePuzzleSolutionMoves(row.solutionMoves ?? ""));
  }

  for (const row of woodpeckerRows) {
    const id = (row.puzzleId ?? "").trim();
    if (!id) continue;
    woodpeckerMap.set(id, parseWoodpeckerSolutionSequence(row.solutionSequence ?? ""));
  }

  const allIds = new Set<string>([...puzzleMap.keys(), ...woodpeckerMap.keys()]);
  const diffs: DiffRow[] = [];

  for (const id of allIds) {
    const p = puzzleMap.get(id);
    const w = woodpeckerMap.get(id);
    if (!p && w) {
      diffs.push({
        puzzleId: id,
        type: "missing-in-puzzle",
        puzzleMoves: "",
        woodpeckerMoves: w.join(" "),
        puzzleMoveCount: 0,
        woodpeckerMoveCount: w.length,
      });
      continue;
    }
    if (p && !w) {
      diffs.push({
        puzzleId: id,
        type: "missing-in-woodpecker",
        puzzleMoves: p.join(" "),
        woodpeckerMoves: "",
        puzzleMoveCount: p.length,
        woodpeckerMoveCount: 0,
      });
      continue;
    }
    const pMoves = p ?? [];
    const wMoves = w ?? [];
    const same =
      pMoves.length === wMoves.length && pMoves.every((m, i) => m === wMoves[i]);
    diffs.push({
      puzzleId: id,
      type: same ? "match" : "mismatch",
      puzzleMoves: pMoves.join(" "),
      woodpeckerMoves: wMoves.join(" "),
      puzzleMoveCount: pMoves.length,
      woodpeckerMoveCount: wMoves.length,
    });
  }

  diffs.sort((a, b) => a.puzzleId.localeCompare(b.puzzleId));
  writeReport(diffs);

  const counts = diffs.reduce<Record<DiffType, number>>(
    (acc, d) => {
      acc[d.type] += 1;
      return acc;
    },
    {
      match: 0,
      mismatch: 0,
      "missing-in-woodpecker": 0,
      "missing-in-puzzle": 0,
    }
  );

  console.log("--- Puzzle Response Comparison ---");
  console.log("puzzle.csv rows:", puzzleMap.size);
  console.log("woodpecker rows:", woodpeckerMap.size);
  console.log("Matches:", counts.match);
  console.log("Mismatches:", counts.mismatch);
  console.log("Missing in woodpecker:", counts["missing-in-woodpecker"]);
  console.log("Missing in puzzle:", counts["missing-in-puzzle"]);
  console.log("Report:", REPORT_PATH);

  const preview = diffs
    .filter((d) => d.type !== "match")
    .slice(0, 10)
    .map((d) => `${d.puzzleId} [${d.type}] puzzle="${d.puzzleMoves}" | woodpecker="${d.woodpeckerMoves}"`);
  if (preview.length > 0) {
    console.log("\nFirst differences:");
    preview.forEach((line) => console.log(`  ${line}`));
  }
}

main();
