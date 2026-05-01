/**
 * Full pipeline: validate CSV, generate JSON, print report.
 * Does not seed Dexie (Node has no IndexedDB). Seed in-browser via seedPuzzlesFromGeneratedJson().
 * Usage: npm run import:puzzles
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

const OUT_DIR = path.join(process.cwd(), "data", "generated");
const PUBLIC_OUT_DIR = path.join(process.cwd(), "public", "data", "generated");

function resolveCsvPath(): string {
  const argIndex = process.argv.indexOf("--csv");
  const argPath =
    argIndex >= 0 && process.argv[argIndex + 1] && !process.argv[argIndex + 1].startsWith("--")
      ? process.argv[argIndex + 1]
      : undefined;
  const fromEnv = process.env.PUZZLE_CSV_PATH;
  const selected =
    argPath ?? fromEnv ?? path.join(process.cwd(), "data", "imports", "puzzle.csv");
  return path.isAbsolute(selected) ? selected : path.join(process.cwd(), selected);
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const CSV_PATH = resolveCsvPath();
  console.log("Puzzle import pipeline\n");

  if (!fs.existsSync(CSV_PATH)) {
    console.error("Error: File not found:", CSV_PATH);
    console.error("Create data/imports/puzzle.csv and run again.");
    process.exit(1);
  }

  const csvText = fs.readFileSync(CSV_PATH, "utf-8");
  const { rows } = parseCsv(csvText);
  const { valid, errors } = validateAndTransformAll(rows);

  if (errors.length > 0) {
    console.log("Validation failed.\n");
    errors.forEach((e) => console.log(`  row ${e.row}: ${e.message}`));
    console.log("\nFix errors and run: npm run validate:puzzles");
    process.exit(1);
  }

  console.log("Step 1: Validation passed.", valid.length, "rows.\n");

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

  for (const [setId, puzzles] of bySet) {
    const base = `${exercisesJsonBasename(setId)}-exercises.json`;
    writeJson(path.join(OUT_DIR, base), puzzles);
    writeJson(path.join(PUBLIC_OUT_DIR, base), puzzles);
  }

  console.log("Step 2: Generated JSON.");
  console.log("  ", OUT_DIR);
  console.log("  ", PUBLIC_OUT_DIR);
  console.log(
    "  Sets:",
    [...bySet.entries()]
      .map(([id, p]) => `${id} (${p.length})`)
      .join(", ")
  );
  console.log("\nNext: In the app, run seedPuzzlesFromGeneratedJson() (e.g. from a dev-only button) to load into Dexie.");
}

main();
