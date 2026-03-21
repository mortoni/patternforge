import { describe, it, expect } from "vitest";
import { exercisesCompletedExcludingSkips } from "./exercises-completed";

describe("exercisesCompletedExcludingSkips", () => {
  it("subtracts skips from attempts", () => {
    expect(exercisesCompletedExcludingSkips(5, 2)).toBe(3);
  });

  it("never goes negative", () => {
    expect(exercisesCompletedExcludingSkips(1, 5)).toBe(0);
  });

  it("treats non-finite skipped as zero", () => {
    expect(exercisesCompletedExcludingSkips(2, Number.NaN)).toBe(2);
  });
});
