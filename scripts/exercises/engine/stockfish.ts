/**
 * Minimal local Stockfish helper (UCI over stdin/stdout).
 * Not wired into the Next.js app — scripts / developer validation only.
 *
 * Requires `stockfish` on PATH (e.g. `brew install stockfish`).
 */

import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import * as readline from "node:readline";
import {
  buildStockfishGoCommand,
  buildStockfishSetOptionLines,
  mergeStockfishConfig,
  type StockfishAnalysisConfig,
} from "./stockfish-config";

export type { StockfishAnalysisConfig } from "./stockfish-config";

export interface AnalyzePositionResult {
  bestMove: string;
  evaluation: {
    type: "cp" | "mate";
    value: number;
  };
  pv: string[];
}

/**
 * Parse one UCI `info ...` line for multipv 1 (or implicit multipv).
 * Returns undefined if the line is not usable (wrong multipv, no score, etc.).
 */
export function parseUciInfoLine(line: string):
  | {
      depth: number;
      score: { type: "cp" | "mate"; value: number };
      pv: string[];
    }
  | undefined {
  if (!line.startsWith("info ")) return undefined;

  const multipvMatch = line.match(/\bmultipv (\d+)\b/);
  const multipv = multipvMatch ? Number.parseInt(multipvMatch[1], 10) : 1;
  if (multipv !== 1) return undefined;

  const depthMatch = line.match(/\bdepth (\d+)\b/);
  if (!depthMatch) return undefined;
  const depth = Number.parseInt(depthMatch[1], 10);

  let score: { type: "cp" | "mate"; value: number } | undefined;
  const mateM = line.match(/\bscore mate (-?\d+)\b/);
  const cpM = line.match(/\bscore cp (-?\d+)\b/);
  if (mateM) {
    score = { type: "mate", value: Number.parseInt(mateM[1], 10) };
  } else if (cpM) {
    score = { type: "cp", value: Number.parseInt(cpM[1], 10) };
  }
  if (!score) return undefined;

  const pvIdx = line.indexOf(" pv ");
  const pv =
    pvIdx === -1
      ? []
      : line
          .slice(pvIdx + 4)
          .trim()
          .split(/\s+/)
          .filter(Boolean);

  return { depth, score, pv };
}

/** Parse `bestmove e2e4` / `bestmove (none)` */
export function parseUciBestMoveLine(line: string): string | undefined {
  const m = line.match(/^bestmove (\S+)/);
  return m ? m[1] : undefined;
}

function killProcess(proc: ChildProcessWithoutNullStreams): void {
  try {
    proc.stdin?.end();
  } catch {
    /* ignore */
  }
  if (!proc.killed) {
    proc.kill("SIGTERM");
  }
}

/** Partial overrides for {@link DEFAULT_STOCKFISH_ANALYSIS_CONFIG} (see `stockfish-config.ts`). */
export type AnalyzePositionOptions = Partial<StockfishAnalysisConfig> & {
  /** Alias for `timeoutMsPerPosition` (CLI convenience). */
  timeoutMs?: number;
};

/**
 * Run Stockfish on a FEN and return best move, last reported score (multipv 1), and PV.
 */
export async function analyzePosition(
  fen: string,
  options: AnalyzePositionOptions = {}
): Promise<AnalyzePositionResult> {
  const { timeoutMs, ...rest } = options;
  const cfg = mergeStockfishConfig({
    ...rest,
    ...(timeoutMs != null ? { timeoutMsPerPosition: timeoutMs } : {}),
  });
  const timeoutMsPerPosition = cfg.timeoutMsPerPosition;

  const trimmedFen = fen.trim();
  if (!trimmedFen) {
    throw new Error("analyzePosition: empty FEN");
  }

  const setLines = buildStockfishSetOptionLines(cfg);
  const goLine = buildStockfishGoCommand(cfg);
  const initBlock = [
    "uci",
    ...setLines,
    "isready",
    `position fen ${trimmedFen}`,
    goLine,
    "",
  ].join("\n");

  return new Promise((resolve, reject) => {
    const proc = spawn("stockfish", [], {
      stdio: ["pipe", "pipe", "pipe"],
    }) as ChildProcessWithoutNullStreams;

    let settled = false;
    let lastDepth = -1;
    let lastScore: { type: "cp" | "mate"; value: number } | undefined;
    let lastPv: string[] = [];

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      killProcess(proc);
      fn();
    };

    const timer = setTimeout(() => {
      settle(() => {
        rl.close();
        reject(
          new Error(`Stockfish timeout after ${timeoutMsPerPosition}ms`)
        );
      });
    }, timeoutMsPerPosition);

    const rl = readline.createInterface({ input: proc.stdout });

    proc.on("error", (err) => {
      settle(() => {
        rl.close();
        reject(err);
      });
    });

    rl.on("line", (line) => {
      const info = parseUciInfoLine(line);
      if (info && info.depth >= lastDepth) {
        lastDepth = info.depth;
        lastScore = info.score;
        if (info.pv.length > 0) {
          lastPv = info.pv;
        }
      }

      const bm = parseUciBestMoveLine(line);
      if (bm === undefined) return;

      settle(() => {
        rl.close();
        if (!lastScore) {
          reject(
            new Error(
              "Stockfish finished without a scored info line (try higher depth or check FEN)"
            )
          );
          return;
        }
        resolve({
          bestMove: bm === "(none)" ? "" : bm,
          evaluation: lastScore,
          pv: lastPv,
        });
      });
    });

    proc.on("close", (code, signal) => {
      if (settled) return;
      settle(() => {
        rl.close();
        reject(
          new Error(
            `Stockfish exited before bestmove (code=${code}, signal=${signal ?? "none"})`
          )
        );
      });
    });

    proc.stdin.write(initBlock);
  });
}
