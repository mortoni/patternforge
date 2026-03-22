/**
 * Single source of truth for local Stockfish analysis used by engine validation scripts.
 *
 * Book / CSV moves remain authoritative; these settings only strengthen engine agreement
 * as a **confidence signal** (no auto-accept of Stockfish output).
 */

import * as os from "node:os";

export interface StockfishAnalysisConfig {
  /** UCI `Skill Level` (20 = full strength). */
  skillLevel: number;
  /** When false, engine is not artificially weakened. */
  uciLimitStrength: boolean;
  /** Hash table size (MB). */
  hashMb: number;
  /** Search threads (capped for laptops). */
  threads: number;
  /** Primary search bound: selective depth. */
  depth: number;
  /** Optional extra bound (ms); if set, sent as `go depth … movetime …` (whichever Stockfish satisfies first). */
  movetimeMs?: number;
  /** Wall-clock limit per position (spawn → bestmove). */
  timeoutMsPerPosition: number;
}

function defaultThreads(): number {
  const n = os.cpus()?.length ?? 4;
  return Math.max(1, Math.min(8, n));
}

export const DEFAULT_STOCKFISH_ANALYSIS_CONFIG: StockfishAnalysisConfig = {
  skillLevel: 20,
  uciLimitStrength: false,
  hashMb: 128,
  threads: defaultThreads(),
  depth: 20,
  movetimeMs: undefined,
  timeoutMsPerPosition: 120_000,
};

export function mergeStockfishConfig(
  overrides: Partial<StockfishAnalysisConfig>
): StockfishAnalysisConfig {
  const out = { ...DEFAULT_STOCKFISH_ANALYSIS_CONFIG };
  for (const key of Object.keys(overrides) as (keyof StockfishAnalysisConfig)[]) {
    const v = overrides[key];
    if (v !== undefined) {
      (out as Record<string, unknown>)[key] = v;
    }
  }
  return out;
}

/** UCI init lines after `uci`, before `isready` (excluding trailing newline on last line — caller joins). */
export function buildStockfishSetOptionLines(cfg: StockfishAnalysisConfig): string[] {
  return [
    `setoption name Skill Level value ${cfg.skillLevel}`,
    `setoption name UCI_LimitStrength value ${cfg.uciLimitStrength}`,
    `setoption name Hash value ${cfg.hashMb}`,
    `setoption name Threads value ${cfg.threads}`,
  ];
}

/** `go` command after `position fen …`. */
export function buildStockfishGoCommand(cfg: StockfishAnalysisConfig): string {
  if (cfg.movetimeMs != null && cfg.movetimeMs > 0) {
    return `go depth ${cfg.depth} movetime ${Math.floor(cfg.movetimeMs)}`;
  }
  return `go depth ${cfg.depth}`;
}

/** Human-readable one-liner for logs. */
export function formatStockfishConfigSummary(cfg: StockfishAnalysisConfig): string {
  const mt =
    cfg.movetimeMs != null && cfg.movetimeMs > 0
      ? ` movetime=${cfg.movetimeMs}ms`
      : "";
  return (
    `SkillLevel=${cfg.skillLevel} UCI_LimitStrength=${cfg.uciLimitStrength} ` +
    `Hash=${cfg.hashMb}MB Threads=${cfg.threads} depth=${cfg.depth}${mt} ` +
    `timeout=${cfg.timeoutMsPerPosition}ms`
  );
}
