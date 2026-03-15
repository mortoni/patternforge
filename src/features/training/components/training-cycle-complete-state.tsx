"use client";

import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export interface TrainingCycleCompleteStateProps {
  trainingSetName: string;
  cycleNumber: number;
  solvedCount?: number;
  totalExercises?: number;
}

export function TrainingCycleCompleteState({
  trainingSetName,
  cycleNumber,
  solvedCount,
  totalExercises,
}: TrainingCycleCompleteStateProps) {
  const description =
    solvedCount != null && totalExercises != null
      ? `You reached the end of the current cycle. ${trainingSetName} · Cycle ${cycleNumber}: ${solvedCount} / ${totalExercises} solved.`
      : `You reached the end of the current cycle.`;

  return (
    <EmptyState title="Cycle complete" description={description}>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild variant="default">
          <Link href={ROUTES.sets}>Back to Training Sets</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={ROUTES.app}>Return to Dashboard</Link>
        </Button>
      </div>
    </EmptyState>
  );
}
