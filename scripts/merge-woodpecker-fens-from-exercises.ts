/**
 * One-off merge: fill `fen` in woodpecker_1128_dataset.csv from exercises.csv
 * by matching exercise_number (woodpecker) to chapterNumber (exercises).
 */

import { mkdir, readFile, rename, writeFile } from "fs/promises";
import * as path from "path";
import { parseCsv } from "../src/lib/csv";

const EXERCISES_PATH = path.join(process.cwd(), "data", "exercises.csv");
const WOODPECKER_PATH = path.join(process.cwd(), "data", "woodpecker_1128_dataset.csv");

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

async function main(): Promise<void> {
  const exercisesText = await readFile(EXERCISES_PATH, "utf-8");
  const { rows: exerciseRows } = parseCsv(exercisesText);
  const chapterToFen = new Map<number, string>();
  for (const row of exerciseRows) {
    const ch = parseInt(row.chapterNumber ?? "", 10);
    if (!Number.isNaN(ch) && row.fen) chapterToFen.set(ch, row.fen);
  }
  console.log("Loaded", chapterToFen.size, "FENs from exercises.csv");

  const woodpeckerText = await readFile(WOODPECKER_PATH, "utf-8");
  const { headers, rows: woodpeckerRows } = parseCsv(woodpeckerText);
  let updated = 0;
  for (const row of woodpeckerRows) {
    const ex = parseInt(row.exercise_number ?? "", 10);
    if (Number.isNaN(ex)) continue;
    const fen = chapterToFen.get(ex);
    if (fen !== undefined) {
      row.fen = fen;
      updated++;
    }
  }
  console.log("Updated", updated, "rows with FEN from exercises.csv");

  await atomicWriteFile(WOODPECKER_PATH, serializeCsv(headers, woodpeckerRows));
  console.log("Wrote", WOODPECKER_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
