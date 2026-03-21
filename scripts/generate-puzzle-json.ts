/**
 * Converts puzzle.csv to normalized JSON files per training set and all-puzzles.
 * Usage: npm run generate:puzzles
 */

import * as fs from "fs";
import * as path from "path";
import { parseCsv } from "../src/lib/csv";
import {
  validateAndTransformAll,
  buildTrainingSetMetaFromPuzzles,
  groupPuzzlesByTrainingSet,
  exercisesJsonBasename,
} from "../src/lib/puzzle-import";

const CSV_PATH = path.join(process.cwd(), "data", "imports", "puzzle.csv");
const OUT_DIR = path.join(process.cwd(), "data", "generated");
const PUBLIC_OUT_DIR = path.join(process.cwd(), "public", "data", "generated");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  console.log("Reading", CSV_PATH);

  if (!fs.existsSync(CSV_PATH)) {
    console.error("Error: File not found:", CSV_PATH);
    process.exit(1);
  }

  const csvText = fs.readFileSync(CSV_PATH, "utf-8");
  const { rows } = parseCsv(csvText);
  const { valid, errors } = validateAndTransformAll(rows);

  if (errors.length > 0) {
    console.error("Validation failed. Fix errors first (run npm run validate:puzzles).");
    errors.forEach((e) => console.error(`  row ${e.row}: ${e.message}`));
    process.exit(1);
  }

  ensureDir(OUT_DIR);
  ensureDir(PUBLIC_OUT_DIR);

  const meta = buildTrainingSetMetaFromPuzzles(valid);
  const bySet = groupPuzzlesByTrainingSet(valid);

  const writeJson = (filePath: string, data: unknown) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  };

  writeJson(path.join(OUT_DIR, "all-puzzles.json"), valid);
  writeJson(path.join(OUT_DIR, "training-sets-meta.json"), meta);
  writeJson(path.join(PUBLIC_OUT_DIR, "all-puzzles.json"), valid);
  writeJson(path.join(PUBLIC_OUT_DIR, "training-sets-meta.json"), meta);

  const counts: string[] = [];
  for (const [setId, puzzles] of bySet) {
    const base = `${exercisesJsonBasename(setId)}-exercises.json`;
    writeJson(path.join(OUT_DIR, base), puzzles);
    writeJson(path.join(PUBLIC_OUT_DIR, base), puzzles);
    counts.push(`${setId}: ${puzzles.length}`);
  }

  console.log("Generated:", OUT_DIR);
  console.log("Also copied to public for in-browser fetch:", PUBLIC_OUT_DIR);
  console.log("Per set —", counts.join("; "));
}

main();
