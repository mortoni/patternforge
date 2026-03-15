/**
 * Full pipeline: validate CSV, generate JSON, print report.
 * Does not seed Dexie (Node has no IndexedDB). Seed in-browser via seedPuzzlesFromGeneratedJson().
 * Usage: npm run import:puzzles
 */

import * as fs from "fs";
import * as path from "path";
import { parseCsv } from "../src/lib/csv";
import { validateAndTransformAll } from "../src/lib/puzzle-import";
import type { GeneratedTrainingSetMeta } from "../src/domain/training/types/puzzle-import.types";

const CSV_PATH = path.join(process.cwd(), "data", "imports", "puzzle.csv");
const OUT_DIR = path.join(process.cwd(), "data", "generated");
const PUBLIC_OUT_DIR = path.join(process.cwd(), "public", "data", "generated");

const TRAINING_SET_META: GeneratedTrainingSetMeta[] = [
  { id: "easy", name: "Easy Exercises", description: "Introductory tactical exercises.", difficulty: "easy" },
  { id: "intermediate", name: "Intermediate Exercises", description: "More demanding tactical exercises.", difficulty: "intermediate" },
  { id: "advanced", name: "Advanced Exercises", description: "Hard tactical exercises for advanced training.", difficulty: "advanced" },
];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
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

  const easy = valid.filter((p) => p.trainingSetId === "easy");
  const intermediate = valid.filter((p) => p.trainingSetId === "intermediate");
  const advanced = valid.filter((p) => p.trainingSetId === "advanced");

  const writeJson = (filePath: string, data: unknown) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  };

  writeJson(path.join(OUT_DIR, "easy-exercises.json"), easy);
  writeJson(path.join(OUT_DIR, "intermediate-exercises.json"), intermediate);
  writeJson(path.join(OUT_DIR, "advanced-exercises.json"), advanced);
  writeJson(path.join(OUT_DIR, "all-puzzles.json"), valid);
  writeJson(path.join(OUT_DIR, "training-sets-meta.json"), TRAINING_SET_META);

  writeJson(path.join(PUBLIC_OUT_DIR, "easy-exercises.json"), easy);
  writeJson(path.join(PUBLIC_OUT_DIR, "intermediate-exercises.json"), intermediate);
  writeJson(path.join(PUBLIC_OUT_DIR, "advanced-exercises.json"), advanced);
  writeJson(path.join(PUBLIC_OUT_DIR, "all-puzzles.json"), valid);
  writeJson(path.join(PUBLIC_OUT_DIR, "training-sets-meta.json"), TRAINING_SET_META);

  console.log("Step 2: Generated JSON.");
  console.log("  ", OUT_DIR);
  console.log("  ", PUBLIC_OUT_DIR);
  console.log("  easy:", easy.length, "intermediate:", intermediate.length, "advanced:", advanced.length);
  console.log("\nNext: In the app, run seedPuzzlesFromGeneratedJson() (e.g. from a dev-only button) to load into Dexie.");
}

main();
