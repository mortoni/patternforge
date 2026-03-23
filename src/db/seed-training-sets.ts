/**
 * Safe development seed for training sets and exercises.
 * Only runs when no training sets exist. Do not run in production.
 */

import { db } from "./dexie";
import { createId } from "@/lib/ids";
import { toISOString } from "@/lib/dates";
import type { TrainingSetSchema } from "./schema";
import type { ExerciseSchema } from "./schema";
import type { CycleRunSchema } from "./schema";

/** Reusable sample exercises; puzzleNumber set for display consistency. */
const SAMPLE_EXERCISES: Omit<ExerciseSchema, "id" | "trainingSetId" | "createdAt">[] = [
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 4",
    sideToMove: "w",
    solutionMoves: ["Ng5", "Nf7"],
    source: "seed",
    motifTags: ["fork", "knight"],
    puzzleNumber: 1,
  },
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    sideToMove: "w",
    solutionMoves: ["Qxf7#"],
    source: "seed",
    motifTags: ["checkmate", "scholars"],
    puzzleNumber: 2,
  },
  {
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    sideToMove: "b",
    solutionMoves: ["e5", "c5"],
    source: "seed",
    motifTags: ["opening"],
    puzzleNumber: 3,
  },
  {
    fen: "r2qkb1r/ppp2ppp/2n1bn2/3pp1B1/3PP3/2N2N2/PPP2PPP/R2QKB1R w KQkq - 0 6",
    sideToMove: "w",
    solutionMoves: ["Bxf6", "Qxf6", "Nxe5"],
    source: "seed",
    motifTags: ["pin", "tactic"],
    puzzleNumber: 4,
  },
  {
    fen: "5rk1/1b3p1p/pp1p4/3P4/2P2Q2/1P4P1/P4P1P/4R1K1 w - - 0 1",
    sideToMove: "w",
    solutionMoves: ["Re8", "Rxe8", "Qf8#"],
    source: "seed",
    motifTags: ["back rank", "checkmate"],
    puzzleNumber: 5,
  },
];

/** Derive firstMove from solutionMoves[0] for first-move validation. Seed data uses SAN; comparison normalizes to UCI. */
function makeExercise(
  trainingSetId: string,
  createdAt: string,
  overrides?: Partial<ExerciseSchema>
): ExerciseSchema {
  const base: ExerciseSchema = {
    id: createId(),
    trainingSetId,
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    sideToMove: "w",
    solutionMoves: ["e4"],
    source: "seed",
    motifTags: [],
    createdAt,
    ...overrides,
  };
  if (base.firstMove == null && base.solutionMoves.length > 0) {
    base.firstMove = base.solutionMoves[0];
  }
  return base;
}

function makeCycleRun(
  trainingSetId: string,
  exerciseCount: number,
  createdAt: string,
  overrides: Partial<CycleRunSchema>
): CycleRunSchema {
  return {
    id: createId(),
    trainingSetId,
    cycleNumber: 1,
    status: "active",
    startedAt: createdAt,
    totalTimeMs: 0,
    solvedCount: 0,
    totalExercises: exerciseCount,
    nextExerciseIndex: 0,
    ...overrides,
  };
}

/**
 * Seeds sample training sets and exercises only if the DB has no training sets.
 * Safe to call on mount in development. No-op in production or when sets already exist.
 *
 * Sample strategy: one set per UI state for local development.
 * - Lichess Mixed 1200–1600: library (has exercises, no cycle)
 * - Tournament Warmup: completed cycle
 * - Rook Tactics: empty set (no exercises)
 */
export async function seedTrainingSetsIfEmpty(): Promise<boolean> {
  const count = await db.trainingSets.count();
  if (count > 0) return false;

  const now = toISOString(new Date());

  // 1. Lichess Mixed 1200–1600 – library (exercises, no cycle)
  const setId1 = createId();
  const exerciseIds1: string[] = [];
  for (let i = 0; i < 5; i++) {
    const ex = makeExercise(setId1, now, SAMPLE_EXERCISES[i] ?? SAMPLE_EXERCISES[0]);
    ex.id = createId();
    exerciseIds1.push(ex.id);
    await db.exercises.add(ex);
  }
  await db.trainingSets.add({
    id: setId1,
    name: "Lichess Mixed 1200–1600",
    description: "Mixed tactics from Lichess puzzle database (rating band).",
    difficulty: "intermediate",
    exerciseIds: exerciseIds1,
    createdAt: now,
    source: "Lichess",
    tags: ["tactics", "mixed"],
  } satisfies TrainingSetSchema);

  // 2. Tournament Warmup – completed cycle
  const setId2 = createId();
  const exerciseIds2: string[] = [];
  for (let i = 0; i < 5; i++) {
    const ex = makeExercise(setId2, now, SAMPLE_EXERCISES[i] ?? SAMPLE_EXERCISES[0]);
    ex.id = createId();
    exerciseIds2.push(ex.id);
    await db.exercises.add(ex);
  }
  await db.trainingSets.add({
    id: setId2,
    name: "Tournament Warmup",
    description: "Short set to warm up before a game.",
    difficulty: "intermediate",
    exerciseIds: exerciseIds2,
    createdAt: now,
    source: "Custom",
    tags: ["tournament", "mixed"],
  } satisfies TrainingSetSchema);
  await db.cycleRuns.add(
    makeCycleRun(setId2, 5, now, {
      id: createId(),
      status: "completed",
      completedAt: now,
      solvedCount: 5,
      nextExerciseIndex: 5,
    })
  );

  // 3. Rook Tactics – empty set (no exercises; tests empty-state UI)
  const setId3 = createId();
  await db.trainingSets.add({
    id: setId3,
    name: "Rook Tactics",
    description: "Rook-themed tactics (add exercises to get started).",
    difficulty: "easy",
    exerciseIds: [],
    createdAt: now,
    source: "Custom",
    tags: ["rook"],
  } satisfies TrainingSetSchema);

  return true;
}

/**
 * Ensures default app settings exist. Safe to call whenever.
 */
export async function seedDefaultSettingsIfMissing(): Promise<void> {
  const existing = await db.settings.get("default");
  if (existing) return;
  await db.settings.put({
    id: "default",
    theme: "system",
    boardOrientation: "white",
    boardStyle: "classic",
    lastTrainingSetId: undefined,
    autoBoardOrientation: false,
  });
}
