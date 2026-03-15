/**
 * Validates puzzle.csv and reports errors with row numbers.
 * Usage: npm run validate:puzzles
 */

import * as fs from "fs";
import * as path from "path";
import { parseCsv } from "../src/lib/csv";
import { validateAndTransformAll } from "../src/lib/puzzle-import";

const CSV_PATH = path.join(process.cwd(), "data", "imports", "puzzle.csv");

function main() {
  console.log("Validating", CSV_PATH, "\n");

  if (!fs.existsSync(CSV_PATH)) {
    console.error("Error: File not found:", CSV_PATH);
    process.exit(1);
  }

  const csvText = fs.readFileSync(CSV_PATH, "utf-8");
  const { headers, rows } = parseCsv(csvText);

  if (rows.length === 0) {
    console.log("No data rows found.");
    return;
  }

  const { valid, errors } = validateAndTransformAll(rows);

  if (errors.length > 0) {
    console.log("Validation errors:\n");
    errors.forEach((e) => {
      const pathStr = e.path ? ` (${e.path})` : "";
      console.log(`  row ${e.row}: ${e.message}${pathStr}`);
    });
  }

  const bySet = { easy: 0, intermediate: 0, advanced: 0 };
  valid.forEach((p) => {
    if (p.trainingSetId in bySet) bySet[p.trainingSetId as keyof typeof bySet]++;
  });

  console.log("\n--- Summary ---");
  console.log("Total rows:", rows.length);
  console.log("Valid rows:", valid.length);
  console.log("Invalid rows:", errors.length);
  console.log("Per set - easy:", bySet.easy, "intermediate:", bySet.intermediate, "advanced:", bySet.advanced);

  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
