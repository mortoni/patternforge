/**
 * Converts puzzle.csv to normalized JSON files per training set and all-puzzles.
 * Usage: npm run generate:puzzles
 */

import * as fs from "fs";
import * as path from "path";
import { parseCsv } from "../src/lib/csv";
import { validateAndTransformAll } from "../src/lib/puzzle-import";
import type { NormalizedPuzzle } from "../src/domain/training/types/puzzle-import.types";
import type { GeneratedTrainingSetMeta } from "../src/domain/training/types/puzzle-import.types";

const CSV_PATH = path.join(process.cwd(), "data", "imports", "puzzle.csv");
const OUT_DIR = path.join(process.cwd(), "data", "generated");
const PUBLIC_OUT_DIR = path.join(process.cwd(), "public", "data", "generated");

const TRAINING_SET_META: GeneratedTrainingSetMeta[] = [
  {
    id: "easy",
    name: "Woodpecker Easy",
    description: "Woodpecker method - easier positions.",
    difficulty: "easy",
  },
  {
    id: "intermediate",
    name: "Woodpecker Intermediate",
    description: "Woodpecker method - intermediate level.",
    difficulty: "intermediate",
  },
  {
    id: "advanced",
    name: "Woodpecker Advance",
    description: "Woodpecker method - advanced positions.",
    difficulty: "advanced",
  },
];

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

  console.log("Generated:", OUT_DIR);
  console.log("Also copied to public for in-browser fetch:", PUBLIC_OUT_DIR);
  console.log(
    "easy:",
    easy.length,
    "intermediate:",
    intermediate.length,
    "advanced:",
    advanced.length
  );
}

main();
