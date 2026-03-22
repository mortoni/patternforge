/**
 * Smoke test for local Stockfish (PATH). Run: pnpm run exercises:engine:test
 */

import { analyzePosition } from "./stockfish";
import {
  buildStockfishGoCommand,
  DEFAULT_STOCKFISH_ANALYSIS_CONFIG,
  formatStockfishConfigSummary,
} from "./stockfish-config";

const SAMPLE_FEN =
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";

async function main(): Promise<void> {
  console.log("Stockfish smoke test");
  console.log("FEN:", SAMPLE_FEN);
  console.log(
    "Defaults:",
    formatStockfishConfigSummary(DEFAULT_STOCKFISH_ANALYSIS_CONFIG)
  );
  console.log("Search:", buildStockfishGoCommand(DEFAULT_STOCKFISH_ANALYSIS_CONFIG));
  console.log("—".repeat(60));

  const result = await analyzePosition(SAMPLE_FEN, {});

  console.log("bestMove:     ", result.bestMove || "(none)");
  console.log(
    "evaluation:   ",
    result.evaluation.type === "cp"
      ? `${result.evaluation.value} cp (centipawns, side to move)`
      : `M${result.evaluation.value} (mate in N for side to move)`
  );
  console.log("pv:           ", result.pv.length ? result.pv.join(" ") : "(empty)");
  console.log("—".repeat(60));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
