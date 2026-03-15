/**
 * Dev seed: inserts one sample training set and a few exercises.
 * Call explicitly (e.g. from a dev-only button or script), do not auto-run.
 */

import { db } from "./dexie";
import { createId } from "@/lib/ids";
import { toISOString } from "@/lib/dates";

export async function seedDevData(): Promise<void> {
  const now = toISOString(new Date());
  const setId = createId();

  await db.trainingSets.add({
    id: setId,
    name: "Sample Tactics",
    description: "Development sample set",
    difficulty: "intermediate",
    exerciseIds: [],
    createdAt: now,
  });

  const exerciseIds: string[] = [];
  for (let i = 0; i < 3; i++) {
    const id = createId();
    exerciseIds.push(id);
    await db.exercises.add({
      id,
      trainingSetId: setId,
      fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 4",
      sideToMove: "w",
      solutionMoves: ["Ng5", "Nf7"],
      source: "seed",
      motifTags: ["fork"],
      createdAt: now,
    });
  }

  await db.trainingSets.update(setId, { exerciseIds });
}
