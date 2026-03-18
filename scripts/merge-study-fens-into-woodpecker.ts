/**
 * Copy FENs from output/study-fens.csv into data/woodpecker_1128_dataset.csv
 * by matching chapterNumber (study-fens) to exercise_number (woodpecker).
 *
 * - Validation (129–150): compare existing woodpecker FEN with study-fens; report match/mismatch (no overwrite).
 * - Merge (151+): update woodpecker rows with FEN from study-fens for exercise_number >= 151.
 *
 * Usage: pnpm exec tsx scripts/merge-study-fens-into-woodpecker.ts
 */

import { mkdir, readFile, rename, writeFile } from "fs/promises";
import * as path from "path";
import { parseCsv } from "../src/lib/csv";

const STUDY_FENS_PATH = path.join(process.cwd(), "output", "study-fens.csv");
const WOODPECKER_PATH = path.join(process.cwd(), "data", "woodpecker_1128_dataset.csv");

const VALIDATE_MIN = 129;
const VALIDATE_MAX = 150;
const MERGE_FROM = 151;

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

/** Normalize FEN for comparison (trim; position only, ignore move counters if desired). */
function normalizeFen(fen: string): string {
  return (fen ?? "").trim();
}

async function main(): Promise<void> {
  const studyFensText = await readFile(STUDY_FENS_PATH, "utf-8");
  const { rows: studyRows } = parseCsv(studyFensText);
  const chapterToFen = new Map<number, string>();
  for (const row of studyRows) {
    const ch = parseInt(row.chapterNumber ?? "", 10);
    if (!Number.isNaN(ch) && (row.fen ?? "").trim()) chapterToFen.set(ch, row.fen.trim());
  }
  console.log("Loaded", chapterToFen.size, "FENs from output/study-fens.csv\n");

  const woodpeckerText = await readFile(WOODPECKER_PATH, "utf-8");
  const { headers, rows: woodpeckerRows } = parseCsv(woodpeckerText);
  const byExercise = new Map<number, Record<string, string>>();
  for (const row of woodpeckerRows) {
    const ex = parseInt(row.exercise_number ?? "", 10);
    if (!Number.isNaN(ex)) byExercise.set(ex, row);
  }

  // --- Validation 129–150 ---
  console.log("Validation (exercise_number 129–150): woodpecker vs study-fens");
  let matchCount = 0;
  let mismatchCount = 0;
  let missingInWoodpecker = 0;
  let missingInStudy = 0;
  for (let ex = VALIDATE_MIN; ex <= VALIDATE_MAX; ex++) {
    const wp = byExercise.get(ex);
    const studyFen = chapterToFen.get(ex);
    const wpFen = wp ? normalizeFen(wp.fen ?? "") : "";
    if (!studyFen) {
      missingInStudy++;
      continue;
    }
    if (!wp) {
      missingInWoodpecker++;
      continue;
    }
    if (wpFen === studyFen) {
      matchCount++;
      console.log(`  ${ex}: match`);
    } else {
      mismatchCount++;
      console.log(`  ${ex}: MISMATCH`);
      console.log(`      woodpecker: ${wpFen || "(empty)"}`);
      console.log(`      study-fens: ${studyFen}`);
    }
  }
  console.log("");
  console.log("Summary 129–150: match:", matchCount, "| mismatch:", mismatchCount, "| missing in study-fens:", missingInStudy, "| missing in woodpecker:", missingInWoodpecker);
  console.log("");

  // --- Merge from 151 ---
  let updated = 0;
  for (const row of woodpeckerRows) {
    const ex = parseInt(row.exercise_number ?? "", 10);
    if (Number.isNaN(ex) || ex < MERGE_FROM) continue;
    const fen = chapterToFen.get(ex);
    if (fen !== undefined) {
      row.fen = fen;
      updated++;
    }
  }
  console.log("Merge (exercise_number >= 151): updated", updated, "rows with FEN from study-fens.");

  await atomicWriteFile(WOODPECKER_PATH, serializeCsv(headers, woodpeckerRows));
  console.log("Wrote", WOODPECKER_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
