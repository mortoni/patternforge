/**
 * Run the full exercise pipeline (normalize → validate → certify → apply overrides) and print a short summary.
 *
 * Usage: pnpm run exercises:verify
 *
 * Stops on the first failing step (typically normalize if the CSV is invalid).
 * Validate, certify, and apply-overrides remain non-blocking on their own; this orchestrator exits non‑zero
 * only if a step returns a non‑zero exit code (e.g. normalize).
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const SUMMARY_PATH = path.join(
  process.cwd(),
  "data",
  "exercises",
  "generated",
  "exercise.summary.json"
);

interface SummaryTotals {
  total: number;
  certified: number;
  manual_review: number;
  broken: number;
  pending: number;
}

function runStep(label: string, command: string): void {
  console.log(`\n── ${label} ──\n`);
  execSync(command, { stdio: "inherit", cwd: process.cwd(), env: process.env });
}

function printSummary(): void {
  console.log("\n");
  if (!fs.existsSync(SUMMARY_PATH)) {
    console.log(
      "No exercise.summary.json found (pipeline may have stopped before certify).\n"
    );
    return;
  }
  try {
    const raw = JSON.parse(
      fs.readFileSync(SUMMARY_PATH, "utf-8")
    ) as { totals?: SummaryTotals };
    const t = raw.totals;
    if (!t) {
      console.log("Summary file has no totals.\n");
      return;
    }
    const lines = [
      "══════════════════════════════════════════════════",
      "  Exercise pipeline — summary",
      "══════════════════════════════════════════════════",
      `  Total exercises:     ${t.total}`,
      `  Certified:           ${t.certified}`,
      `  Manual review:       ${t.manual_review}`,
      `  Broken:              ${t.broken}`,
      `  Pending:             ${t.pending}`,
      "══════════════════════════════════════════════════",
      "",
      `  Artifacts: data/exercises/generated/`,
      "",
    ];
    console.log(lines.join("\n"));
  } catch (e) {
    console.warn(
      "Could not read exercise.summary.json:",
      e instanceof Error ? e.message : e
    );
  }
}

function main(): void {
  console.log("Pattern Forge — exercise verification pipeline\n");

  try {
    runStep("1/4  Normalize (CSV → contract)", "pnpm run exercises:normalize");
    runStep("2/4  Validate (static checks)", "pnpm run exercises:validate");
    runStep("3/4  Certify (status + split JSON)", "pnpm run exercises:certify");
    runStep(
      "4/4  Apply manual overrides → exercise.final.json",
      "pnpm run exercises:apply-overrides"
    );
  } catch {
    console.error("\nPipeline stopped: a step exited with an error.\n");
    printSummary();
    process.exitCode = 1;
    return;
  }

  printSummary();
}

main();
