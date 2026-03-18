import { describe, it, expect } from "vitest";
import { toSanFromFen } from "./move-notation";

describe("toSanFromFen", () => {
  it("converts UCI capture to SAN", () => {
    const fen = "4k3/8/8/8/8/5Rr1/8/4K3 w - - 0 1";
    expect(toSanFromFen(fen, "f3g3")).toBe("Rxg3");
  });

  it("preserves check suffix from contextual SAN", () => {
    const fen = "4k3/8/8/8/8/5R2/8/4K3 w - - 0 1";
    expect(toSanFromFen(fen, "f3f8")).toBe("Rf8+");
  });

  it("renders castling SAN", () => {
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    expect(toSanFromFen(fen, "e1g1")).toBe("O-O");
  });

  it("returns original move when illegal in given position", () => {
    const fen = "8/8/8/8/8/8/8/4K3 w - - 0 1";
    expect(toSanFromFen(fen, "e2e4")).toBe("e2e4");
  });
});
