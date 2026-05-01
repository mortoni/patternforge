/**
 * Build data/imports/puzzle-new.csv from data/imports/puzzle.csv,
 * replacing only solutionMoves with values from:
 * data/woodpecker_solution_sequences_all_exercises.csv
 *
 * Matching key: puzzleId = {trainingSetId}-{puzzleNumber padded to 4}
 *
 * Usage:
 *   pnpm build:puzzle-new
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
const OUTPUT_CSV_PATH = path.join(process.cwd(), "data", "imports", "puzzle-new.csv");

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

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function writeCsv(headers: string[], rows: Record<string, string>[], outPath: string): void {
  const lines: string[] = [];
  lines.push(headers.map(csvEscape).join(","));
  for (const row of rows) {
    const values = headers.map((h) => csvEscape(row[h] ?? ""));
    lines.push(values.join(","));
  }
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
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

  const puzzleParsed = parseCsv(fs.readFileSync(PUZZLE_CSV_PATH, "utf-8"));
  const woodpeckerRows = parseCsv(fs.readFileSync(WOODPECKER_CSV_PATH, "utf-8")).rows;

  const woodpeckerMoveMap = new Map<string, string>();
  for (const row of woodpeckerRows) {
    const id = (row.puzzleId ?? "").trim();
    if (!id) continue;
    const moves = parseWoodpeckerSolutionSequence(row.solutionSequence ?? "");
    if (moves.length === 0) continue;
    woodpeckerMoveMap.set(id, moves.join(" "));
  }

  let replaced = 0;
  let unchangedNoMatch = 0;
  let unchangedSame = 0;

  const nextRows = puzzleParsed.rows.map((row) => {
    const id = puzzleIdFromPuzzleCsvRow(row);
    const mappedMoves = woodpeckerMoveMap.get(id);
    if (!mappedMoves) {
      unchangedNoMatch += 1;
      return row;
    }
    if ((row.solutionMoves ?? "").trim() === mappedMoves.trim()) {
      unchangedSame += 1;
      return row;
    }
    replaced += 1;
    return {
      ...row,
      solutionMoves: mappedMoves,
    };
  });

  writeCsv(puzzleParsed.headers, nextRows, OUTPUT_CSV_PATH);

  console.log("--- puzzle-new.csv build ---");
  console.log("Input rows:", puzzleParsed.rows.length);
  console.log("Woodpecker rows with parsed moves:", woodpeckerMoveMap.size);
  console.log("solutionMoves replaced:", replaced);
  console.log("unchanged (already same):", unchangedSame);
  console.log("unchanged (no woodpecker match):", unchangedNoMatch);
  console.log("Output:", OUTPUT_CSV_PATH);
}

main();
