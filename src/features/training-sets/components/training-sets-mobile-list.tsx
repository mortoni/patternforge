"use client";

import { TrainingSetCard } from "./training-set-card";
import type { TrainingSetOverview } from "../types";

export interface TrainingSetsMobileListProps {
  overviews: TrainingSetOverview[];
  onContinue: (id: string) => Promise<void>;
  onStartCycle: (id: string) => Promise<void>;
}

/** Compact card list for small screens; reuses TrainingSetCard with overview data. */
export function TrainingSetsMobileList({
  overviews,
  onContinue,
  onStartCycle,
}: TrainingSetsMobileListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {overviews.map((overview) => (
        <TrainingSetCard
          key={overview.trainingSetId}
          overview={overview}
          onContinue={onContinue}
          onStartCycle={onStartCycle}
        />
      ))}
    </div>
  );
}
