/**
 * Dashboard feature service. Provides data for the continue-training card.
 * Client-side only.
 */

import { getSettings } from "@/repositories/settings.repository";
import { getTrainingSetById } from "@/repositories/training-set.repository";
import { getActiveCycleRunForSet } from "@/repositories/cycle-run.repository";

export interface ContinueTrainingCardData {
  trainingSetId: string;
  name: string;
  cycleNumber: number;
  solvedCount: number;
  totalExercises: number;
}

/**
 * Returns data for the "Continue Training" card when user has an active cycle.
 */
export async function getContinueTrainingCard(): Promise<ContinueTrainingCardData | null> {
  const settings = await getSettings();
  const trainingSetId = settings?.lastTrainingSetId;
  if (!trainingSetId) return null;

  const [set, activeCycle] = await Promise.all([
    getTrainingSetById(trainingSetId),
    getActiveCycleRunForSet(trainingSetId),
  ]);
  if (!set || !activeCycle) return null;

  return {
    trainingSetId,
    name: set.name,
    cycleNumber: activeCycle.cycleNumber,
    solvedCount: activeCycle.solvedCount,
    totalExercises: activeCycle.totalExercises,
  };
}
