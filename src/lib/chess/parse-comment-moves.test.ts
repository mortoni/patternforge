import { describe, expect, it } from "vitest";
import {
  extractWoodpeckerBranchLines,
  inferMainLineFromComment,
  parseNumberedCommentMoves,
} from "./parse-comment-moves";
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

  it("infers queen-winning branch when 23...fxe6 is an alternative to Kxe6", () => {
    const fen = "r5r1/pp2kpBQ/3pn3/6q1/8/8/P4PPP/3RR1K1 w - - 0 1";
    const comment =
      "23.Rxe6+! Kxe6 23...fxe6 24.Bh6++- ✓ wins the queen. 24.Qe4+ ✓ Kd7 White's position is winning.";
    const inferred = inferMainLineFromComment(fen, "w", comment);
    expect(inferred?.mainLine).toEqual(["Rxe6+", "fxe6", "Bh6+"]);
    expect(inferred?.source).toBe("checkmark-segment");
  });

  it("extracts both sibling branches from Woodpecker notation", () => {
    const fen = "r5r1/pp2kpBQ/3pn3/6q1/8/8/P4PPP/3RR1K1 w - - 0 1";
    const comment =
      "23.Rxe6+! Kxe6 23...fxe6 24.Bh6++- ✓ wins the queen. 24.Qe4+ ✓ Kd7";
    const branches = extractWoodpeckerBranchLines(fen, "w", comment);
    expect(branches).toContainEqual(["Rxe6+", "fxe6", "Bh6+"]);
    expect(branches).toContainEqual(["Rxe6+", "Kxe6", "Qe4+"]);
  });

  it("infers main line when Or marks a white alternative at the same move number", () => {
    const fen = "8/2R3pk/2N2r1p/1p3p2/1Pb1p2P/8/1r3PP1/R5K1 b - - 0 1";
    const comment =
      "33...e3! Black had a dominant position and an extra pawn, so he could win slowly in many ways, but this is the quickest winner. 34.f3 Or 34.fxe3 Rg6 quickly forces mate. 34...Rg6 ✓ It's still a forced mate. 35.g4 fxg4 36.f4 Bd5 37.Nd4 Ra6";
    const inferred = inferMainLineFromComment(fen, "b", comment);
    expect(inferred?.mainLine).toEqual(["e3", "f3", "Rg6"]);
    expect(inferred?.source).toBe("checkmark-segment");
  });

  it("uses the first N... reply when later N... lines are refutations", () => {
    const fen = "1rbk1bnr/ppNpppp1/7p/1N6/4P3/3q4/P2B1PPP/1R1QK2R w K - 0 1";
    const comment =
      "14.Ne6+! The knight cannot be taken due to the discovered attack. 14...Ke8 14...fxe6 15.Ba5++- ✓ and 14...dxe6 15.Ba5+ ✓ wins the queen and the game. 15.Nbc7 mate ✓";
    const inferred = inferMainLineFromComment(fen, "w", comment);
    expect(inferred?.mainLine).toEqual(["Ne6+", "Ke8", "Nbc7#"]);
    expect(inferred?.source).toBe("checkmark-segment");
  });

  it.skip("skips embedded refutation lines and keeps the main game continuation", () => {
    const fen = "5rnr/pp2kpp1/1b1p3p/nBpP2N1/4PN2/8/P4PPP/4RRK1 w - - 0 1";
    const comment =
      "White is a pawn down, so has to create something. 19.Nge6! fxe6 It would have been better for Black to give up the exchange on f8 with 19...g6. With a pawn and opposite-coloured bishops for the exchange, Black has some compensation. Note that the bishop on b5 is essential after 19...g5 20.Nxf8 gxf4 21.Nd7!. ✓ Now, 21...Bd8 22.e5! is the only winning move, but that's not necessary to see before sacrificing the knight. The point is 22...a6 23.exd6+ Kxd6 24.Ne5!+- threatening a fork on f7.20.Ng6+ Kf7 The knight would not escape from h8 after 20...Kf6, but White has 21.Nxf8+- ✓. 21.Nxh8+ Kf6 The knight looks trapped, but it has two ways to escape. 22.f4 22.Re3 is also good: 22...g5 23.Rf3+ Kg7 24.Rxf8 Kxf8 25.dxe6 with a safe square on f7.22...Ne7 23.e5+!+- ✓ Kf5 24.Bd3+! 1-0 Not only can the white knight escape, the black king is mated!";
    const inferred = inferMainLineFromComment(fen, "w", comment);
    expect(inferred?.mainLine).toEqual([
      "Nge6",
      "fxe6",
      "Ng6+",
      "Kf7",
      "Nxh8+",
      "Kf6",
      "f4",
      "Ne7",
      "e5+",
      "Kf5",
      "Bd3+",
    ]);
    expect(inferred?.source).toBe("numbered-moves");
  });
});
