import { ROUTES } from "@/lib/constants";
import { getActiveCycleRuns } from "@/repositories/cycle-run.repository";
import type { CycleRunSchema } from "@/db/schema";

function isActiveLikeStatus(status: string): boolean {
  return status === "active" || status === "in_progress";
}

/** Most recent active cycle across all sets, if any. */
export async function getActiveCycle(): Promise<CycleRunSchema | null> {
  const runs = await getActiveCycleRuns();
  const active = runs
    .filter((r) => isActiveLikeStatus(r.status))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return active[0] ?? null;
}

/** App entry route: continue active cycle, otherwise start from sets. */
export async function resolveAppEntryRoute(): Promise<string> {
  const activeCycle = await getActiveCycle();
  return activeCycle ? ROUTES.training : ROUTES.sets;
}
