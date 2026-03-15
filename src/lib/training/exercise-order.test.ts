import { describe, it, expect } from "vitest";
import { orderExercises } from "./exercise-order";
import type { ExerciseSchema } from "@/db/schema";

describe("orderExercises", () => {
  it("sorts by puzzleNumber ascending when present", () => {
    const exercises: ExerciseSchema[] = [
      {
        id: "e3",
        trainingSetId: "set-1",
        fen: "fen",
        sideToMove: "w",
        solutionMoves: [],
        createdAt: "2025-01-03",
        puzzleNumber: 3,
      },
      {
        id: "e1",
        trainingSetId: "set-1",
        fen: "fen",
        sideToMove: "w",
        solutionMoves: [],
        createdAt: "2025-01-01",
        puzzleNumber: 1,
      },
      {
        id: "e2",
        trainingSetId: "set-1",
        fen: "fen",
        sideToMove: "w",
        solutionMoves: [],
        createdAt: "2025-01-02",
        puzzleNumber: 2,
      },
    ];
    const ordered = orderExercises(exercises);
    expect(ordered.map((e) => e.puzzleNumber)).toEqual([1, 2, 3]);
    expect(ordered.map((e) => e.id)).toEqual(["e1", "e2", "e3"]);
  });

  it("treats missing puzzleNumber as 0", () => {
    const exercises: ExerciseSchema[] = [
      {
        id: "e2",
        trainingSetId: "set-1",
        fen: "fen",
        sideToMove: "w",
        solutionMoves: [],
        createdAt: "2025-01-02",
        puzzleNumber: 2,
      },
      {
        id: "e0",
        trainingSetId: "set-1",
        fen: "fen",
        sideToMove: "w",
        solutionMoves: [],
        createdAt: "2025-01-01",
      },
    ];
    const ordered = orderExercises(exercises);
    expect(ordered[0].id).toBe("e0");
    expect(ordered[1].id).toBe("e2");
  });

  it("uses stable fallback (createdAt, then id) when no puzzleNumber", () => {
    const exercises: ExerciseSchema[] = [
      {
        id: "e-b",
        trainingSetId: "set-1",
        fen: "fen",
        sideToMove: "w",
        solutionMoves: [],
        createdAt: "2025-01-02",
      },
      {
        id: "e-a",
        trainingSetId: "set-1",
        fen: "fen",
        sideToMove: "w",
        solutionMoves: [],
        createdAt: "2025-01-01",
      },
      {
        id: "e-c",
        trainingSetId: "set-1",
        fen: "fen",
        sideToMove: "w",
        solutionMoves: [],
        createdAt: "2025-01-01",
      },
    ];
    const ordered = orderExercises(exercises);
    expect(ordered.map((e) => e.id)).toEqual(["e-a", "e-c", "e-b"]);
  });

  it("returns empty array for empty input", () => {
    expect(orderExercises([])).toEqual([]);
  });
});
