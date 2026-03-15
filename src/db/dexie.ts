/**
 * PatternForge IndexedDB database via Dexie.
 * All Dexie usage must be client-side only.
 */

import Dexie, { type Table } from "dexie";
import type {
  AppInstanceSchema,
  AppSettingsSchema,
  TrainingSetSchema,
  ExerciseSchema,
  CycleRunSchema,
  SessionSchema,
  ExerciseAttemptSchema,
  MistakeEntrySchema,
} from "./schema";

export class PatternForgeDB extends Dexie {
  appInstance!: Table<AppInstanceSchema, string>;
  settings!: Table<AppSettingsSchema, string>;
  trainingSets!: Table<TrainingSetSchema, string>;
  exercises!: Table<ExerciseSchema, string>;
  cycleRuns!: Table<CycleRunSchema, string>;
  sessions!: Table<SessionSchema, string>;
  exerciseAttempts!: Table<ExerciseAttemptSchema, string>;
  mistakeEntries!: Table<MistakeEntrySchema, string>;

  constructor() {
    super("PatternForgeDB");
    // v1: initial schema
    this.version(1).stores({
      appInstance: "installationId, createdAt, lastOpenedAt",
      settings: "id",
      trainingSets: "id, name, difficulty, createdAt",
      exercises: "id, trainingSetId, createdAt",
      cycleRuns:
        "id, trainingSetId, cycleNumber, status, [trainingSetId+status], startedAt, completedAt",
      sessions: "id, trainingSetId, cycleRunId, status, startedAt, endedAt",
      exerciseAttempts:
        "id, exerciseId, cycleRunId, sessionId, result, startedAt",
      mistakeEntries:
        "id, exerciseId, trainingSetId, status, createdAt, lastReviewedAt",
    });
    // v2: compound index for mistake uniqueness by (trainingSetId, exerciseId); enables getByTrainingSetAndExercise
    this.version(2).stores({
      appInstance: "installationId, createdAt, lastOpenedAt",
      settings: "id",
      trainingSets: "id, name, difficulty, createdAt",
      exercises: "id, trainingSetId, createdAt",
      cycleRuns:
        "id, trainingSetId, cycleNumber, status, [trainingSetId+status], startedAt, completedAt",
      sessions: "id, trainingSetId, cycleRunId, status, startedAt, endedAt",
      exerciseAttempts:
        "id, exerciseId, cycleRunId, sessionId, result, startedAt",
      mistakeEntries:
        "id, exerciseId, trainingSetId, [trainingSetId+exerciseId], status, createdAt, lastReviewedAt",
    });
  }
}

export const db = new PatternForgeDB();
