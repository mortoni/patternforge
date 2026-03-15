"use client";

import { StatCard } from "@/components/shared/StatCard";
import { formatDurationMs } from "@/lib/format-duration";
import { formatPercentageFromFraction } from "@/lib/format-percentage";
import type { AnalyticsSummary } from "@/services/analytics.service";

export interface AnalyticsSummaryCardsProps {
  summary: AnalyticsSummary | null;
}

export function AnalyticsSummaryCards({ summary }: AnalyticsSummaryCardsProps) {
  if (!summary) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total sessions"
        value={String(summary.totalSessions)}
        description="Completed training sessions"
      />
      <StatCard
        label="Total attempts"
        value={String(summary.totalAttempts)}
        description="Puzzles attempted"
      />
      <StatCard
        label="Overall accuracy"
        value={formatPercentageFromFraction(summary.overallAccuracy, 0)}
        description="Correct rate"
      />
      <StatCard
        label="Total training time"
        value={formatDurationMs(summary.totalTrainingTimeMs)}
        description="Active solving time"
      />
    </div>
  );
}
