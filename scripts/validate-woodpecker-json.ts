/**
 * Validate Woodpecker JSON bundles in public/data/woodpecker.
 *
 * Usage:
 *   pnpm run validate:woodpecker
 *   pnpm run validate:woodpecker -- --dir public/data/woodpecker
 *   pnpm run validate:woodpecker -- --report public/data/reports/woodpecker-validation-report.json
 */

import * as fs from "fs";
import * as path from "path";
import { Chess } from "chess.js";
import { z } from "zod";

const SET_IDS = [
  "woodpecker-easy",
  "woodpecker-intermediate",
  "woodpecker-advanced",
] as const;

const uciMoveSchema = z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/i);

const woodpeckerPuzzleSchema = z.object({
  id: z.string().min(1),
  puzzleNumber: z.number().int().positive(),
  fen: z.string().min(1),
  sideToMove: z.enum(["w", "b"]),
  difficulty: z.enum(["easy", "intermediate", "advanced"]),
  solution: z.object({
    mainLine: z.array(z.string().min(1)),
    uci: z.array(z.string()),
    fullLine: z.array(
      z.object({
        move: z.string().min(1),
        uci: z.string(),
      })
    ),
  }),
  metadata: z.object({
    motifTags: z.array(z.string()),
    gameSource: z.string(),
    comment: z.string().optional(),
  }),
  validation: z.object({
    status: z.literal("unverified"),
    engineScore: z.null(),
    alternativeFirstMoves: z.array(z.string()),
  }),
});

const woodpeckerBundleSchema = z.object({
  trainingSetId: z.enum(SET_IDS),
  puzzles: z.array(woodpeckerPuzzleSchema),
});

type ValidationIssue = {
  file: string;
  message: string;
};

type PuzzleIssueReport = {
  file: string;
  trainingSetId: (typeof SET_IDS)[number];
  puzzleId: string;
  puzzleNumber: number;
  issues: string[];
};

type ValidationReport = {
  generatedAt: string;
  baseDir: string;
  summary: {
    totalPuzzles: number;
    puzzlesWithIssues: number;
    totalIssues: number;
  };
  puzzlesBySet: Record<(typeof SET_IDS)[number], PuzzleIssueReport[]>;
};

function resolveBaseDir(): string {
  const argIndex = process.argv.indexOf("--dir");
  const argPath =
    argIndex >= 0 && process.argv[argIndex + 1] && !process.argv[argIndex + 1].startsWith("--")
      ? process.argv[argIndex + 1]
      : undefined;
  const selected = argPath ?? path.join(process.cwd(), "public", "data", "woodpecker");
  return path.isAbsolute(selected) ? selected : path.join(process.cwd(), selected);
}

function resolveReportPath(): string {
  const argIndex = process.argv.indexOf("--report");
  const argPath =
    argIndex >= 0 && process.argv[argIndex + 1] && !process.argv[argIndex + 1].startsWith("--")
      ? process.argv[argIndex + 1]
      : undefined;
  const selected =
    argPath ??
    path.join(
      process.cwd(),
      "public",
      "data",
      "reports",
      "woodpecker-validation-report.json"
    );
  return path.isAbsolute(selected) ? selected : path.join(process.cwd(), selected);
}

function loadBundle(filePath: string) {
  const text = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(text) as unknown;
  return woodpeckerBundleSchema.parse(json);
}

function parseUci(
  move: string
): { from: string; to: string; promotion?: "q" | "r" | "b" | "n" } | null {
  const t = move.trim().toLowerCase();
  const match = t.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);
  if (!match) return null;
  return {
    from: match[1],
    to: match[2],
    ...(match[3] ? { promotion: match[3] as "q" | "r" | "b" | "n" } : {}),
  };
}

function toUci(from: string, to: string, promotion?: string): string {
  return `${from}${to}${promotion ?? ""}`.toLowerCase();
}

function tryApplySanMove(chess: Chess, san: string) {
  try {
    const strict = chess.move(san);
    if (strict) return strict;
  } catch {
    // Fallback below.
  }
  try {
    return (
      chess as unknown as { move: (m: string, opts?: unknown) => ReturnType<Chess["move"]> }
    ).move(san, { sloppy: true });
  } catch {
    return null;
  }
}

function validateBundle(
  fileName: string,
  expectedSetId: (typeof SET_IDS)[number],
  bundle: z.infer<typeof woodpeckerBundleSchema>
): { issues: ValidationIssue[]; puzzleReports: PuzzleIssueReport[] } {
  const issues: ValidationIssue[] = [];
  const puzzleReports: PuzzleIssueReport[] = [];

  if (bundle.trainingSetId !== expectedSetId) {
    issues.push({
      file: fileName,
      message: `trainingSetId mismatch: expected "${expectedSetId}", found "${bundle.trainingSetId}"`,
    });
  }

  const seenIds = new Set<string>();
  const seenPuzzleNumbers = new Set<number>();

  bundle.puzzles.forEach((puzzle, idx) => {
    const puzzleIssues: string[] = [];
    const row = `puzzle[${idx}] (${puzzle.id})`;

    if (seenIds.has(puzzle.id)) {
      const message = `${row}: duplicate id "${puzzle.id}"`;
      issues.push({ file: fileName, message });
      puzzleIssues.push("duplicate id");
    }
    seenIds.add(puzzle.id);

    if (seenPuzzleNumbers.has(puzzle.puzzleNumber)) {
      const message = `${row}: duplicate puzzleNumber ${puzzle.puzzleNumber}`;
      issues.push({ file: fileName, message });
      puzzleIssues.push("duplicate puzzleNumber");
    }
    seenPuzzleNumbers.add(puzzle.puzzleNumber);

    let fenValid = true;
    try {
      const chess = new Chess(puzzle.fen);
      if (chess.turn() !== puzzle.sideToMove) {
        const message = `${row}: sideToMove=${puzzle.sideToMove} but FEN turn=${chess.turn()}`;
        issues.push({ file: fileName, message });
        puzzleIssues.push("sideToMove does not match FEN turn");
      }
    } catch {
      const message = `${row}: invalid FEN "${puzzle.fen}"`;
      issues.push({ file: fileName, message });
      puzzleIssues.push("invalid FEN");
      fenValid = false;
    }

    const mainLineLen = puzzle.solution.mainLine.length;
    const uciLen = puzzle.solution.uci.length;
    const fullLineLen = puzzle.solution.fullLine.length;
    if (!(mainLineLen === uciLen && uciLen === fullLineLen)) {
      const message = `${row}: solution length mismatch (mainLine=${mainLineLen}, uci=${uciLen}, fullLine=${fullLineLen})`;
      issues.push({ file: fileName, message });
      puzzleIssues.push("solution length mismatch");
    }

    puzzle.solution.uci.forEach((uci, moveIdx) => {
      if (uci === "") return;
      if (!uciMoveSchema.safeParse(uci).success) {
        const message = `${row}: invalid UCI at solution.uci[${moveIdx}]="${uci}"`;
        issues.push({ file: fileName, message });
        puzzleIssues.push(`invalid UCI at ply ${moveIdx + 1}`);
      }
    });

    puzzle.solution.fullLine.forEach((entry, moveIdx) => {
      const fromMainLine = puzzle.solution.mainLine[moveIdx];
      const fromUci = puzzle.solution.uci[moveIdx];
      if (entry.move !== fromMainLine) {
        const message = `${row}: fullLine[${moveIdx}].move mismatch with mainLine[${moveIdx}]`;
        issues.push({ file: fileName, message });
        puzzleIssues.push(`fullLine move mismatch at ply ${moveIdx + 1}`);
      }
      if (entry.uci !== fromUci) {
        const message = `${row}: fullLine[${moveIdx}].uci mismatch with uci[${moveIdx}]`;
        issues.push({ file: fileName, message });
        puzzleIssues.push(`fullLine UCI mismatch at ply ${moveIdx + 1}`);
      }
    });

    if (fenValid) {
      const chess = new Chess(puzzle.fen);
      for (let moveIdx = 0; moveIdx < puzzle.solution.mainLine.length; moveIdx += 1) {
        const san = puzzle.solution.mainLine[moveIdx];
        const uci = puzzle.solution.uci[moveIdx];
        const ply = moveIdx + 1;
        const hasMissingUci = uci == null || uci.trim() === "";
        const parsed = hasMissingUci ? null : parseUci(uci);

        if (hasMissingUci) {
          const message = `${row}: missing UCI at ply ${ply} (mainLine="${san}")`;
          issues.push({ file: fileName, message });
          puzzleIssues.push(`missing UCI at ply ${ply}`);
        } else if (!parsed) {
          const message = `${row}: invalid UCI format at ply ${ply}: "${uci}"`;
          issues.push({ file: fileName, message });
          puzzleIssues.push(`invalid UCI format at ply ${ply}`);
        }

        const sanApplied = tryApplySanMove(chess, san);
        if (!sanApplied) {
          const message = `${row}: illegal SAN at ply ${ply}: "${san}"`;
          issues.push({ file: fileName, message });
          puzzleIssues.push(`illegal SAN at ply ${ply}`);
          break;
        }

        const expectedUci = toUci(sanApplied.from, sanApplied.to, sanApplied.promotion);
        if (hasMissingUci || !parsed) {
          continue;
        }

        const normalizedUci = toUci(parsed.from, parsed.to, parsed.promotion);
        if (normalizedUci !== expectedUci) {
          const message =
            `${row}: mainLine does not match UCI at ply ${ply} ` +
            `(mainLine="${san}", expectedUci="${expectedUci}", actualUci="${normalizedUci}")`;
          issues.push({ file: fileName, message });
          puzzleIssues.push(`mainLine does not match UCI at ply ${ply}`);
        }
      }
    }

    if (puzzleIssues.length > 0) {
      puzzleReports.push({
        file: fileName,
        trainingSetId: bundle.trainingSetId,
        puzzleId: puzzle.id,
        puzzleNumber: puzzle.puzzleNumber,
        issues: [...new Set(puzzleIssues)],
      });
    }
  });

  return { issues, puzzleReports };
}

function writeReport(filePath: string, report: ValidationReport): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), "utf-8");
}

function main() {
  const baseDir = resolveBaseDir();
  const reportPath = resolveReportPath();
  const issues: ValidationIssue[] = [];
  const puzzleReports: PuzzleIssueReport[] = [];
  const counts: Record<string, number> = {};

  if (!fs.existsSync(baseDir)) {
    console.error(`Directory not found: ${baseDir}`);
    process.exit(1);
  }

  for (const setId of SET_IDS) {
    const fileName = `${setId}.json`;
    const filePath = path.join(baseDir, fileName);

    if (!fs.existsSync(filePath)) {
      issues.push({ file: fileName, message: "file not found" });
      continue;
    }

    try {
      const bundle = loadBundle(filePath);
      counts[setId] = bundle.puzzles.length;
      const result = validateBundle(fileName, setId, bundle);
      issues.push(...result.issues);
      puzzleReports.push(...result.puzzleReports);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `unknown parse error: ${String(error)}`;
      issues.push({ file: fileName, message: `invalid JSON/schema: ${message}` });
    }
  }

  console.log(`Validating Woodpecker bundles in: ${baseDir}`);
  console.log("");
  console.log("Counts:");
  for (const setId of SET_IDS) {
    console.log(`  ${setId}: ${counts[setId] ?? 0}`);
  }

  const report: ValidationReport = {
    generatedAt: new Date().toISOString(),
    baseDir,
    summary: {
      totalPuzzles: Object.values(counts).reduce((sum, n) => sum + n, 0),
      puzzlesWithIssues: puzzleReports.length,
      totalIssues: puzzleReports.reduce((sum, p) => sum + p.issues.length, 0),
    },
    puzzlesBySet: {
      "woodpecker-easy": [],
      "woodpecker-intermediate": [],
      "woodpecker-advanced": [],
    },
  };
  for (const puzzleReport of puzzleReports) {
    report.puzzlesBySet[puzzleReport.trainingSetId].push(puzzleReport);
  }
  for (const setId of SET_IDS) {
    report.puzzlesBySet[setId].sort((a, b) => a.puzzleNumber - b.puzzleNumber);
  }
  writeReport(reportPath, report);

  console.log("");
  console.log(`Report written: ${reportPath}`);

  const total = report.summary.totalPuzzles;
  if (issues.length > 0) {
    console.log(
      `Completed with issues: ${report.summary.puzzlesWithIssues}/${total} puzzles.`
    );
    return;
  }
  console.log(`OK: ${total} puzzles validated across ${SET_IDS.length} bundles.`);
}

main();
