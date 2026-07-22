/**
 * Zod schema for the Woodpecker JSON bundles in `public/data/woodpecker/`.
 *
 * Single source of truth for the bundle shape, shared by:
 * - the runtime seeding/reading path (`src/db/seed-puzzles.ts`), which parses
 *   fetched bundles before writing them to IndexedDB, and
 * - the `validate:woodpecker` CLI (`scripts/validate-woodpecker-json.ts`),
 *   which imports it via a relative path.
 *
 * Keep this module dependency-free apart from `zod` so both a browser bundle
 * and a Node script can import it.
 */

import { z } from "zod";

export const WOODPECKER_SET_IDS = [
  "woodpecker-easy",
  "woodpecker-intermediate",
  "woodpecker-advanced",
] as const;

export type WoodpeckerSetId = (typeof WOODPECKER_SET_IDS)[number];

export const woodpeckerPuzzleSchema = z.object({
  id: z.string().min(1),
  puzzleNumber: z.number().int().positive(),
  fen: z.string().min(1),
  sideToMove: z.enum(["w", "b"]),
  difficulty: z.enum(["easy", "intermediate", "advanced"]),
  solution: z.object({
    mainLine: z.array(z.string().min(1)),
    uci: z.array(z.string()),
    fullLine: z.array(
      z.object({
        move: z.string().min(1),
        uci: z.string(),
      })
    ),
  }),
  metadata: z.object({
    motifTags: z.array(z.string()),
    gameSource: z.string(),
    comment: z.string().optional(),
  }),
  validation: z.object({
    status: z.literal("unverified"),
    engineScore: z.null(),
    alternativeFirstMoves: z.array(z.string()),
  }),
});

export type WoodpeckerPuzzle = z.infer<typeof woodpeckerPuzzleSchema>;

export const woodpeckerBundleSchema = z.object({
  trainingSetId: z.enum(WOODPECKER_SET_IDS),
  puzzles: z.array(woodpeckerPuzzleSchema),
});

export type WoodpeckerBundle = z.infer<typeof woodpeckerBundleSchema>;
