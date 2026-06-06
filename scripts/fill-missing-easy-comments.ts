/**
 * Fill metadata.comment for easy puzzles that only have move sequences in the book
 * (no prose commentary). Uses exact book text when known, otherwise formats mainLine.
 *
 * Usage:
 *   pnpm run fill:missing-easy-comments
 *   pnpm run fill:missing-easy-comments -- --write
 */

import * as fs from "fs";
import * as path from "path";
import { formatMoveOnlyComment } from "../src/lib/chess/format-move-only-comment";
import { replayMainLine } from "../src/lib/chess/woodpecker-solution-utils";

/** Exact move-only comments from the Woodpecker easy book (PDF). */
const BOOK_COMMENTS: Partial<Record<number, string>> = {
  48: "25.Nxf7! Rxf7 26.Qh7+! Kf8 27.Qh8 mate ✓",
};

const filePath = path.join(process.cwd(), "public/data/woodpecker/woodpecker-easy.json");

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function main() {
  const write = hasFlag("--write");
  const bundle = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
    puzzles: Array<{
      puzzleNumber: number;
      sideToMove: "w" | "b";
      fen: string;
      metadata: { comment?: string; [key: string]: unknown };
      solution: { mainLine: string[] };
    }>;
  };

  let filled = 0;
  const samples: Array<{ puzzleNumber: number; comment: string }> = [];

  for (const puzzle of bundle.puzzles) {
    const existing = puzzle.metadata.comment;
    if (existing != null && existing.trim() !== "" && existing !== "undefined") {
      continue;
    }

    if (!replayMainLine(puzzle.fen, puzzle.solution.mainLine)) {
      console.warn(`#${puzzle.puzzleNumber}: mainLine does not replay — comment only`);
    }

    const comment =
      BOOK_COMMENTS[puzzle.puzzleNumber] ??
      formatMoveOnlyComment(
        puzzle.solution.mainLine,
        puzzle.sideToMove,
        1
      );

    if (samples.length < 5) {
      samples.push({ puzzleNumber: puzzle.puzzleNumber, comment });
    }

    if (write) {
      puzzle.metadata.comment = comment;
    }
    filled += 1;
  }

  if (write && filled > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(bundle, null, 2)}\n`, "utf-8");
  }

  console.log(`Missing comments filled: ${filled}`);
  if (samples.length > 0) {
    console.log("\nSamples:");
    for (const sample of samples) {
      console.log(`  #${sample.puzzleNumber}: ${sample.comment}`);
    }
  }
  if (!write && filled > 0) {
    console.log("\nDry run. Re-run with --write to apply.");
  }
}

main();
