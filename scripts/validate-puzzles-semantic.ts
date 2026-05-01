/**
 * Semantic puzzle validation:
 * - FEN can be parsed by chess.js
 * - CSV sideToMove matches FEN turn
 * - Every solution move is legal when applied in sequence
 * - Flags short/non-terminal lines as likely incomplete (warning by default)
 *
 * Usage:
 *   pnpm validate:puzzles:semantic
 *   pnpm validate:puzzles:semantic -- --strict-short-lines
 *   pnpm validate:puzzles:semantic:report
 */

import * as fs from "fs";
import * as path from "path";
import { Chess } from "chess.js";
import { parseCsv } from "../src/lib/csv";
import { validateAndTransformRow } from "../src/lib/puzzle-import";

const DEFAULT_REPORT_CSV_PATH = path.join(
  process.cwd(),
  "data",
  "reports",
  "puzzle-semantic-issues.csv"
);
const MIN_RECOMMENDED_PLIES = 3;
const STRICT_SHORT_LINES = process.argv.includes("--strict-short-lines");
const WRITE_REPORT = process.argv.includes("--report-csv");
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
const REPORT_CSV_PATH = (() => {
  const i = process.argv.indexOf("--report-csv");
  const candidate = i >= 0 ? process.argv[i + 1] : undefined;
  if (candidate && !candidate.startsWith("--")) {
    return path.isAbsolute(candidate)
      ? candidate
      : path.join(process.cwd(), candidate);
  }
  return DEFAULT_REPORT_CSV_PATH;
})();

type IssueCode =
  | "fen-invalid"
  | "side-to-move-mismatch"
  | "no-solution-moves"
  | "illegal-solution-move"
  | "likely-incomplete-line";

interface SemanticIssue {
  row: number;
  puzzleId: string;
  severity: "error" | "warning";
  code: IssueCode;
  message: string;
}

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function writeIssueReportCsv(filePath: string, issues: SemanticIssue[]): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const lines = [
    "row,puzzleId,severity,code,issue",
    ...issues.map((i) =>
      [
        csvEscape(i.row),
        csvEscape(i.puzzleId),
        csvEscape(i.severity),
        csvEscape(i.code),
        csvEscape(i.message),
      ].join(",")
    ),
  ];
  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
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

function normalizeMoveToken(raw: string): string {
  return raw
    .trim()
    .normalize("NFKC")
    .replace(/^(\d+)\.(\.\.)?/, "")
    .replace(/^[.…]+/, "")
    .replace(/e\.p\./gi, "")
    // Common piece glyphs used in some book exports.
    .replace(/[£♕♛]/g, "Q")
    .replace(/[¤♘♞]/g, "N")
    .replace(/[¢♔♚]/g, "K")
    .replace(/[¦♖♜]/g, "R")
    .replace(/[¥♗♝]/g, "B")
    .replace(/[!?]+$/g, "")
    .trim();
}

function tryApplyMove(chess: Chess, rawMove: string): boolean {
  const token = normalizeMoveToken(rawMove);
  if (!token) return false;

  const uci = parseUci(token);
  try {
    if (uci) {
      const applied = chess.move(uci);
      return applied != null;
    }
    // Try strict SAN first.
    const strictApplied = chess.move(token);
    if (strictApplied != null) return true;
  } catch {
    // Fallback below.
  }

  try {
    // Some datasets include slightly non-canonical SAN; sloppy parsing helps.
    const sloppyApplied = (chess as unknown as { move: (m: string, opts?: unknown) => unknown }).move(
      token,
      { sloppy: true }
    );
    return sloppyApplied != null;
  } catch {
    return false;
  }
}

function main() {
  const CSV_PATH = resolveCsvPath();
  console.log("Semantic validation", CSV_PATH, "\n");

  if (!fs.existsSync(CSV_PATH)) {
    console.error("Error: File not found:", CSV_PATH);
    process.exit(1);
  }

  const csvText = fs.readFileSync(CSV_PATH, "utf-8");
  const { rows } = parseCsv(csvText);

  const issues: SemanticIssue[] = [];
  let structurallyValid = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const parsed = validateAndTransformRow(row, rowNumber);
    if (!parsed.success) {
      return;
    }
    structurallyValid += 1;

    const puzzle = parsed.data;
    let chess: Chess;
    try {
      chess = new Chess(puzzle.fen);
    } catch {
      issues.push({
        row: rowNumber,
        puzzleId: puzzle.id,
        severity: "error",
        code: "fen-invalid",
        message: `Invalid FEN: ${puzzle.fen}`,
      });
      return;
    }

    if (chess.turn() !== puzzle.sideToMove) {
      issues.push({
        row: rowNumber,
        puzzleId: puzzle.id,
        severity: "error",
        code: "side-to-move-mismatch",
        message: `sideToMove=${puzzle.sideToMove} but FEN turn=${chess.turn()}`,
      });
    }

    const moves = puzzle.solutionMoves.map(normalizeMoveToken).filter(Boolean);
    if (moves.length === 0) {
      issues.push({
        row: rowNumber,
        puzzleId: puzzle.id,
        severity: "error",
        code: "no-solution-moves",
        message: "No solution moves found after normalization.",
      });
      return;
    }

    for (let ply = 0; ply < moves.length; ply += 1) {
      const move = moves[ply];
      const ok = tryApplyMove(chess, move);
      if (!ok) {
        issues.push({
          row: rowNumber,
          puzzleId: puzzle.id,
          severity: "error",
          code: "illegal-solution-move",
          message: `Illegal/unparseable move at ply ${ply + 1}: "${move}"`,
        });
        return;
      }
    }

    const likelyIncomplete =
      moves.length < MIN_RECOMMENDED_PLIES && !chess.isGameOver();
    if (likelyIncomplete) {
      issues.push({
        row: rowNumber,
        puzzleId: puzzle.id,
        severity: "warning",
        code: "likely-incomplete-line",
        message:
          `Line has only ${moves.length} ply/plies and final position is non-terminal. ` +
          `Consider extending continuation (book line may be longer).`,
      });
    }
  });

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const shortLineWarnings = warnings.filter(
    (i) => i.code === "likely-incomplete-line"
  );

  if (errors.length > 0) {
    console.log("Errors:\n");
    errors.forEach((i) => {
      console.log(`  row ${i.row} [${i.puzzleId}] ${i.code}: ${i.message}`);
    });
    console.log("");
  }

  if (warnings.length > 0) {
    console.log("Warnings:\n");
    warnings.forEach((i) => {
      console.log(`  row ${i.row} [${i.puzzleId}] ${i.code}: ${i.message}`);
    });
    console.log("");
  }

  console.log("--- Semantic Summary ---");
  console.log("Total rows:", rows.length);
  console.log("Structurally valid rows checked:", structurallyValid);
  console.log("Errors:", errors.length);
  console.log("Warnings:", warnings.length);
  console.log("Likely incomplete lines:", shortLineWarnings.length);
  console.log("Strict short-lines mode:", STRICT_SHORT_LINES ? "ON" : "OFF");

  if (WRITE_REPORT) {
    writeIssueReportCsv(REPORT_CSV_PATH, issues);
    console.log("Report CSV:", REPORT_CSV_PATH);
  }

  const shouldFail = errors.length > 0 || (STRICT_SHORT_LINES && warnings.length > 0);
  if (shouldFail) process.exit(1);
}

main();
