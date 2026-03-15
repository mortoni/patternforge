"use client";

import { StatCard } from "@/components/shared/StatCard";
import { formatDurationMs } from "@/lib/format-duration";
import type { TrainingSetDetailViewModel } from "../types";

export interface TrainingSetSummaryCardsProps {
  data: TrainingSetDetailViewModel;
}

export function TrainingSetSummaryCards({ data }: TrainingSetSummaryCardsProps) {
  const { trainingSet, activeCycle, totalCompletedCycles, totalTrainingTimeMs } =
    data;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Exercises"
        value={String(trainingSet.exerciseCount)}
        description="Puzzles in set"
      />
      <StatCard
        label="Status"
        value={
          activeCycle
            ? `Cycle ${activeCycle.cycleNumber} active`
            : totalCompletedCycles > 0
              ? "No active cycle"
              : "Not started"
        }
        description={activeCycle ? "In progress" : "Cycle status"}
      />
      <StatCard
        label="Current progress"
        value={
          activeCycle
            ? `${activeCycle.solvedCount} / ${activeCycle.totalExercises}`
            : totalCompletedCycles > 0
              ? "—"
              : "—"
        }
        description={activeCycle ? "This cycle" : "Active cycle"}
      />
      <StatCard
        label="Completed cycles"
        value={String(totalCompletedCycles)}
        description="Total cycles finished"
      />
      {totalTrainingTimeMs != null && totalTrainingTimeMs > 0 && (
        <StatCard
          label="Total time (set)"
          value={formatDurationMs(totalTrainingTimeMs)}
          description="All sessions"
          className="lg:col-span-2"
        />
      )}
    </div>
  );
}
