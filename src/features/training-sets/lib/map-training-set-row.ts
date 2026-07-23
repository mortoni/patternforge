/**
 * Maps service overview to table row view model.
 * Keeps page rendering free of row-mapping logic.
 */

import { WOODPECKER_SET_IDS } from "@/lib/woodpecker/bundle-schema";
import type { TrainingSetOverview } from "../types";
import type { TrainingSetTableRow, TrainingSetSourceLabel, TrainingSetStatusLabel } from "../types";

const BUNDLED_SET_IDS = new Set<string>(WOODPECKER_SET_IDS);

/**
 * Use the set's own source label when it has one. Sets that ship with the app
 * are labelled by their bundle rather than "Custom" — nothing about them is
 * user-authored, and there is no way to create a set by hand yet.
 */
function deriveSource(overview: TrainingSetOverview): TrainingSetSourceLabel {
  const s = overview.source;
  if (s === "Woodpecker" || s === "Lichess" || s === "Custom" || s === "Unknown") {
    return s;
  }
  if (s) return s as TrainingSetSourceLabel;
  return BUNDLED_SET_IDS.has(overview.trainingSetId) ? "Woodpecker" : "Unknown";
}

/** Derive status label from cycle state. */
function deriveStatus(overview: TrainingSetOverview): TrainingSetStatusLabel {
  if (overview.cycleStatus === "active") return "Active";
  if (overview.cycleStatus === "completed") return "Completed";
  return "Not started";
}

/** Format current cycle for display. */
function formatCurrentCycleLabel(overview: TrainingSetOverview): string {
  if (overview.currentCycleNumber != null) {
    return `Cycle ${overview.currentCycleNumber}`;
  }
  return "—";
}

/** Map one overview to a table row. */
export function mapOverviewToTableRow(overview: TrainingSetOverview): TrainingSetTableRow {
  return {
    id: overview.trainingSetId,
    name: overview.name,
    description: overview.description,
    source: deriveSource(overview),
    difficulty: overview.difficulty,
    tags: overview.tags ?? [],
    exerciseCount: overview.exerciseCount,
    status: deriveStatus(overview),
    currentCycleLabel: formatCurrentCycleLabel(overview),
    solvedCount: overview.solvedCount,
    totalExercises: overview.totalExercises,
    completionPercentage: overview.completionPercentage,
    actionLabel: overview.actionLabel,
  };
}

/** Deduplicate by id (stable key) so we never render duplicate rows. */
export function dedupeTableRows(rows: TrainingSetTableRow[]): TrainingSetTableRow[] {
  const byId = new Map<string, TrainingSetTableRow>();
  for (const row of rows) {
    if (!byId.has(row.id)) byId.set(row.id, row);
  }
  return Array.from(byId.values());
}
