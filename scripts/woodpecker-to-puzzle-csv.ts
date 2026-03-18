/**
 * Export rows from woodpecker_1128_dataset.csv that have a FEN into data/imports/puzzle.csv.
 * Maps: section → trainingSetId/difficulty, exercise_number → puzzleNumber, solution JSON → solutionMoves, FEN → sideToMove.
 *
 * Usage: pnpm exec tsx scripts/woodpecker-to-puzzle-csv.ts
 */

import { mkdir, readFile, rename, writeFile } from "fs/promises";
import * as path from "path";
import { parseCsv } from "../src/lib/csv";

const WOODPECKER_PATH = path.join(process.cwd(), "data", "woodpecker_1128_dataset.csv");
const PUZZLE_PATH = path.join(process.cwd(), "data", "imports", "puzzle.csv");

const PUZZLE_HEADERS = [
  "trainingSetId",
  "puzzleNumber",
  "fen",
  "sideToMove",
  "solutionMoves",
  "motifTags",
  "gameSource",
  "difficulty",
  "comment",
] as const;

async function atomicWriteFile(filePath: string, contents: string): Promise<void> {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(filePath)}.tmp`);
  await writeFile(tmp, contents, "utf-8");
  await rename(tmp, filePath);
}

function serializeCsv(headers: string[], rows: Record<string, string>[]): string {
  const escape = (value: string) => {
    const needsQuotes = /[",\n]/.test(value);
    return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
  };
  const headerLine = headers.join(",");
  const lines = rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(","));
  return [headerLine, ...lines].join("\n");
}

/** Get side to move from FEN (second field). */
function sideToMoveFromFen(fen: string): "w" | "b" {
  const part = fen.trim().split(/\s+/)[1];
  return part === "b" ? "b" : "w";
}

/** Parse solution JSON array and return space-separated SAN moves. */
function solutionMovesFromRaw(raw: string): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "";
  try {
    const arr = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(arr)) return "";
    return (arr as string[]).map((s) => String(s).trim()).filter(Boolean).join(" ");
  } catch {
    return "";
  }
}

async function main(): Promise<void> {
  const woodpeckerText = await readFile(WOODPECKER_PATH, "utf-8");
  const { rows } = parseCsv(woodpeckerText);

  const withFen = rows.filter((r) => (r.fen ?? "").trim() !== "");
  console.log("Woodpecker rows with FEN:", withFen.length);

  const puzzleRows: Record<string, string>[] = withFen.map((r) => {
    const fen = (r.fen ?? "").trim();
    const section = (r.section ?? "easy").trim().toLowerCase();
    const trainingSetId =
      section === "intermediate" ? "intermediate" : section === "advanced" ? "advanced" : "easy";
    const puzzleNumber = (r.exercise_number ?? "").trim();
    const solutionMoves = solutionMovesFromRaw(r.solution ?? "");
    const gameSource = (r.title ?? "").trim();

    return {
      trainingSetId,
      puzzleNumber,
      fen,
      sideToMove: sideToMoveFromFen(fen),
      solutionMoves: solutionMoves || "TODO",
      motifTags: "",
      gameSource,
      difficulty: trainingSetId,
      comment: (r.comment ?? "").trim(),
    };
  });

  const csv = serializeCsv([...PUZZLE_HEADERS], puzzleRows);
  await atomicWriteFile(PUZZLE_PATH, csv);
  console.log("Wrote", puzzleRows.length, "rows to", PUZZLE_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
