"use client";

import { StatCard } from "@/components/shared/StatCard";
import { formatDurationMs } from "@/lib/format-duration";
import { formatPercentageFromFraction } from "@/lib/format-percentage";
import type { DashboardStats } from "@/services/analytics.service";

export interface DashboardStatsGridProps {
  stats: DashboardStats | null;
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  if (!stats) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Attempted"
        value={String(stats.totalPuzzlesAttempted)}
        description="Total puzzles attempted"
      />
      <StatCard
        label="Accuracy"
        value={formatPercentageFromFraction(stats.overallAccuracy, 0)}
        description="Overall correct rate"
      />
      <StatCard
        label="Training time"
        value={formatDurationMs(stats.totalTrainingTimeMs)}
        description="Active solving time"
      />
      <StatCard
        label="Mistakes to review"
        value={String(stats.mistakesRemaining)}
        description="Active mistakes"
      />
    </div>
  );
}
