/**
 * Normalize metadata text fields in Woodpecker JSON bundles.
 *
 * Converts book-font / PDF extraction glyphs (£ ¦ ¤ ¥ ¢ †) to standard SAN letters
 * and curly quotes to ASCII apostrophes in comments. gameSource also uses ASCII hyphens
 * instead of Unicode en-dashes between player names.
 *
 * Usage:
 *   pnpm run normalize:woodpecker-comments
 *   pnpm run normalize:woodpecker-comments -- --set woodpecker-easy --write
 */

import * as fs from "fs";
import * as path from "path";
import {
  normalizeChessNotation,
  normalizeGameSource,
} from "../src/lib/chess/normalize-chess-notation";

const SET_IDS = [
  "woodpecker-easy",
  "woodpecker-intermediate",
  "woodpecker-advanced",
] as const;

type WoodpeckerBundle = {
  trainingSetId: (typeof SET_IDS)[number];
  puzzles: Array<{
    puzzleNumber: number;
    metadata: {
      comment?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
};

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return undefined;
  const value = process.argv[idx + 1];
  return value && !value.startsWith("--") ? value : undefined;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function main() {
  const setId = (argValue("--set") ?? "woodpecker-easy") as (typeof SET_IDS)[number];
  const write = hasFlag("--write");

  if (!SET_IDS.includes(setId)) {
    console.error(`Unknown set: ${setId}`);
    process.exit(1);
  }

  const filePath = path.join(process.cwd(), "public/data/woodpecker", `${setId}.json`);
  const bundle = JSON.parse(fs.readFileSync(filePath, "utf-8")) as WoodpeckerBundle;

  const metadataKeys = ["comment", "gameSource"] as const;

  let updatedComments = 0;
  let updatedGameSources = 0;
  let missing = 0;
  const samples: Array<{ puzzleNumber: number; field: string; before: string; after: string }> =
    [];

  for (const puzzle of bundle.puzzles) {
    const comment = puzzle.metadata.comment;
    if (comment == null || comment.trim() === "" || comment === "undefined") {
      missing += 1;
    }

    for (const key of metadataKeys) {
      const value = puzzle.metadata[key];
      if (typeof value !== "string" || value.trim() === "" || value === "undefined") {
        continue;
      }

      const normalized =
        key === "gameSource" ? normalizeGameSource(value) : normalizeChessNotation(value);
      if (normalized === value) {
        continue;
      }

      if (key === "comment") {
        updatedComments += 1;
      } else {
        updatedGameSources += 1;
      }

      if (samples.length < 5) {
        samples.push({
          puzzleNumber: puzzle.puzzleNumber,
          field: key,
          before: value.slice(0, 120),
          after: normalized.slice(0, 120),
        });
      }
      if (write) {
        puzzle.metadata[key] = normalized;
      }
    }
  }

  const updated = updatedComments + updatedGameSources;

  if (write && updated > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(bundle, null, 2)}\n`, "utf-8");
  }

  console.log(`Set: ${setId}`);
  console.log(`Comments updated: ${updatedComments}`);
  console.log(`Game sources updated: ${updatedGameSources}`);
  console.log(`Missing comments: ${missing}`);
  if (samples.length > 0) {
    console.log("\nSamples:");
    for (const sample of samples) {
      console.log(`  #${sample.puzzleNumber} (${sample.field})`);
      console.log(`    before: ${sample.before}`);
      console.log(`    after:  ${sample.after}`);
    }
  }
  if (!write && updated > 0) {
    console.log("\nDry run. Re-run with --write to apply.");
  }
}

main();
