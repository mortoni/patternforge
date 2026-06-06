import { describe, expect, it } from "vitest";
import { inferMainLineFromComment, parseNumberedCommentMoves } from "./parse-comment-moves";
import { buildSolutionFromMainLine } from "./woodpecker-solution-utils";

describe("parseNumberedCommentMoves", () => {
  it("maps book-font glyphs and black move numbers", () => {
    expect(parseNumberedCommentMoves("19...¢xh7 20.£xf8+– ✓")).toEqual([
      { moveNumber: 19, side: "b", san: "Kxh7" },
      { moveNumber: 20, side: "w", san: "Qxf8" },
    ]);
  });
});

describe("inferMainLineFromComment", () => {
  it("infers fork line when comment includes checkmark variation", () => {
    const fen = "4k3/1r2r1pp/1nR2p2/pp1p4/1N1P2P1/1R2PP2/PP3K1P/8 w - - 0 1";
    const inferred = inferMainLineFromComment(
      fen,
      "w",
      "Winning a second pawn. 31.¦xb6 31...axb4 32.¦xb7 ¦xb7 33.¦xb4 1–0"
    );
    expect(inferred?.mainLine).toEqual(["Rxb6", "axb4", "Rxb7", "Rxb7", "Rxb4"]);
  });

  it("does not invent a prefix move that is absent from the comment", () => {
    const fen = "r2q1rk1/pp1nppbp/2p1b1p1/4N1B1/3P4/2PB3P/PP3PP1/R2QR1K1 w - - 0 1";
    const inferred = inferMainLineFromComment(
      fen,
      "w",
      "Keeping the knight and setting up a blockade on the e-file was not realistic, since White has an f-pawn as well. 39.Qf5+ Or 39.Qe4+. 39...Kh8 40.Qxe6± ✓"
    );
    expect(inferred).toBeNull();
  });

  it("builds uci/fullLine from inferred mainLine", () => {
    const fen = "4k3/1r2r1pp/1nR2p2/pp1p4/1N1P2P1/1R2PP2/PP3K1P/8 w - - 0 1";
    const solution = buildSolutionFromMainLine(fen, ["Rxb6", "axb4", "Rxb7", "Rxb7", "Rxb4"]);
    expect(solution?.uci).toEqual(["c6b6", "a5b4", "b6b7", "e7b7", "b3b4"]);
  });
});
