/**
 * Repair Woodpecker puzzle solutions from metadata comments.
 *
 * Uses normalizeChessNotation for book-font glyphs (£ ¦ ¤ ¥ ¢ †) and chess.js replay.
 *
 * Usage:
 *   pnpm run repair:woodpecker -- --set woodpecker-easy
 *   pnpm run repair:woodpecker -- --set woodpecker-easy --write
 *   pnpm run repair:woodpecker -- --set woodpecker-easy --relaxed --write
 *   pnpm run repair:woodpecker -- --set woodpecker-easy --puzzle 56 --write
 */

import * as fs from "fs";
import * as path from "path";
import { inferMainLineFromComment } from "../src/lib/chess/parse-comment-moves";
import {
  buildSolutionFromMainLine,
  replayMainLine,
  type SolutionFields,
} from "../src/lib/chess/woodpecker-solution-utils";

const SET_IDS = [
  "woodpecker-easy",
  "woodpecker-intermediate",
  "woodpecker-advanced",
] as const;

type WoodpeckerPuzzle = {
  id: string;
  puzzleNumber: number;
  fen: string;
  sideToMove: "w" | "b";
  solution: SolutionFields;
  metadata: {
    comment?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type WoodpeckerBundle = {
  trainingSetId: (typeof SET_IDS)[number];
  puzzles: WoodpeckerPuzzle[];
};

type RepairResult = {
  puzzleId: string;
  puzzleNumber: number;
  status: "repaired" | "unchanged" | "skipped" | "failed";
  source?: string;
  reason?: string;
  mainLine?: string[];
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

function loadValidationReport(reportPath: string): Set<string> {
  if (!fs.existsSync(reportPath)) return new Set();
  const report = JSON.parse(fs.readFileSync(reportPath, "utf-8")) as {
    puzzlesBySet: Record<string, Array<{ puzzleId: string }>>;
  };
  const setId = argValue("--set") ?? "woodpecker-easy";
  const entries = report.puzzlesBySet[setId] ?? [];
  return new Set(entries.map((entry) => entry.puzzleId));
}

function repairPuzzle(
  puzzle: WoodpeckerPuzzle,
  onlyIfBroken: boolean,
  brokenIds: Set<string>,
  relaxed = false
): { updated: boolean; result: RepairResult; solution?: SolutionFields } {
  if (onlyIfBroken && !brokenIds.has(puzzle.id)) {
    return {
      updated: false,
      result: {
        puzzleId: puzzle.id,
        puzzleNumber: puzzle.puzzleNumber,
        status: "skipped",
        reason: "not in validation report",
      },
    };
  }

  if (replayMainLine(puzzle.fen, puzzle.solution.mainLine)) {
    const derived = buildSolutionFromMainLine(puzzle.fen, puzzle.solution.mainLine);
    if (!derived) {
      return {
        updated: false,
        result: {
          puzzleId: puzzle.id,
          puzzleNumber: puzzle.puzzleNumber,
          status: "failed",
          reason: "mainLine replays but UCI derivation failed",
        },
      };
    }

    const unchanged =
      JSON.stringify(puzzle.solution.uci) === JSON.stringify(derived.uci) &&
      JSON.stringify(puzzle.solution.fullLine) === JSON.stringify(derived.fullLine);

    return {
      updated: !unchanged,
      solution: derived,
      result: {
        puzzleId: puzzle.id,
        puzzleNumber: puzzle.puzzleNumber,
        status: unchanged ? "unchanged" : "repaired",
        source: "derive-uci",
        mainLine: derived.mainLine,
      },
    };
  }

  const inferred = inferMainLineFromComment(
    puzzle.fen,
    puzzle.sideToMove,
    puzzle.metadata.comment
  );
  if (!inferred) {
    return {
      updated: false,
      result: {
        puzzleId: puzzle.id,
        puzzleNumber: puzzle.puzzleNumber,
        status: "failed",
        reason: puzzle.metadata.comment ? "could not infer line from comment" : "missing comment",
      },
    };
  }

  const trustedSources = new Set(["numbered-moves", "checkmark-segment"]);
  const isMateInOne =
    inferred.mainLine.length === 1 &&
    (inferred.mainLine[0].includes("#") || inferred.mainLine[0].includes("+"));
  const minPliesOk =
    inferred.mainLine.length >= 2 ||
    isMateInOne ||
    (relaxed && inferred.source === "checkmark-segment" && inferred.mainLine.length >= 1);
  if (!trustedSources.has(inferred.source) || !minPliesOk) {
    return {
      updated: false,
      result: {
        puzzleId: puzzle.id,
        puzzleNumber: puzzle.puzzleNumber,
        status: "failed",
        reason: `inferred line not trusted (${inferred.source}, ${inferred.mainLine.length} plies)`,
        mainLine: inferred.mainLine,
      },
    };
  }

  const derived = buildSolutionFromMainLine(puzzle.fen, inferred.mainLine);
  if (!derived) {
    return {
      updated: false,
      result: {
        puzzleId: puzzle.id,
        puzzleNumber: puzzle.puzzleNumber,
        status: "failed",
        reason: "inferred mainLine failed replay",
        mainLine: inferred.mainLine,
      },
    };
  }

  const unchanged =
    JSON.stringify(puzzle.solution.mainLine) === JSON.stringify(derived.mainLine) &&
    JSON.stringify(puzzle.solution.uci) === JSON.stringify(derived.uci);

  return {
    updated: !unchanged,
    solution: derived,
    result: {
      puzzleId: puzzle.id,
      puzzleNumber: puzzle.puzzleNumber,
      status: unchanged ? "unchanged" : "repaired",
      source: inferred.source,
      mainLine: derived.mainLine,
    },
  };
}

function main() {
  const setId = (argValue("--set") ?? "woodpecker-easy") as (typeof SET_IDS)[number];
  const puzzleNumberFilter = argValue("--puzzle")
    ? Number.parseInt(argValue("--puzzle")!, 10)
    : undefined;
  const write = hasFlag("--write");
  const allPuzzles = hasFlag("--all");
  const relaxed = hasFlag("--relaxed");

  if (!SET_IDS.includes(setId)) {
    console.error(`Unknown set: ${setId}`);
    process.exit(1);
  }

  const baseDir = path.join(process.cwd(), "public", "data", "woodpecker");
  const filePath = path.join(baseDir, `${setId}.json`);
  const reportPath = path.join(
    process.cwd(),
    "public",
    "data",
    "reports",
    "woodpecker-validation-report.json"
  );

  const bundle = JSON.parse(fs.readFileSync(filePath, "utf-8")) as WoodpeckerBundle;
  if (!SET_IDS.includes(bundle.trainingSetId)) {
    console.error(`Unexpected trainingSetId: ${bundle.trainingSetId}`);
    process.exit(1);
  }
  const brokenIds = loadValidationReport(reportPath);

  const results: RepairResult[] = [];
  let repairedCount = 0;

  for (const puzzle of bundle.puzzles) {
    if (puzzleNumberFilter != null && puzzle.puzzleNumber !== puzzleNumberFilter) continue;

    const { updated, result, solution } = repairPuzzle(
      puzzle,
      !allPuzzles,
      brokenIds,
      relaxed
    );
    results.push(result);

    if (updated && solution) {
      repairedCount += 1;
      puzzle.solution = solution;
    }
  }

  const summary = {
    setId,
    write,
    relaxed,
    repaired: results.filter((r) => r.status === "repaired").length,
    unchanged: results.filter((r) => r.status === "unchanged").length,
    failed: results.filter((r) => r.status === "failed").length,
    skipped: results.filter((r) => r.status === "skipped").length,
  };

  const reportOutPath = path.join(
    process.cwd(),
    "public",
    "data",
    "reports",
    `${setId}-repair-report.json`
  );
  fs.writeFileSync(
    reportOutPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), summary, results }, null, 2),
    "utf-8"
  );

  if (write && repairedCount > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(bundle, null, 2)}\n`, "utf-8");
  }

  console.log(`Repair report: ${reportOutPath}`);
  console.log(summary);
  if (!write && summary.repaired > 0) {
    console.log("Dry run only. Re-run with --write to apply changes.");
  }
}

main();
