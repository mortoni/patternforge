/**
 * Database migrations. Dexie version upgrades run automatically on db.open().
 * This file runs optional data transforms after the schema is upgraded.
 * All steps must be safe and idempotent; do not destructively wipe user data.
 */

import { db } from "./dexie";

export async function runMigrations(): Promise<void> {
  await db.open();

  // --- v2: Backfill Exercise.firstMove from solutionMoves[0] where missing ---
  // Ensures older rows have firstMove set for first-move validation. Preserves existing firstMove.
  const exercises = await db.exercises.toArray();
  for (const ex of exercises) {
    if (
      (ex.firstMove == null || ex.firstMove === "") &&
      ex.solutionMoves?.length > 0
    ) {
      await db.exercises.update(ex.id, {
        firstMove: ex.solutionMoves[0],
      });
    }
  }
}
