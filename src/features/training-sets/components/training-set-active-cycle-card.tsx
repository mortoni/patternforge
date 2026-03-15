"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDateShort } from "@/lib/format-date";
import type { TrainingSetDetailActiveCycle } from "../types";

export interface TrainingSetActiveCycleCardProps {
  cycle: TrainingSetDetailActiveCycle;
  onContinue: () => void;
}

export function TrainingSetActiveCycleCard({
  cycle,
  onContinue,
}: TrainingSetActiveCycleCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Cycle {cycle.cycleNumber} · Active
        </CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">
          Started {formatDateShort(cycle.startedAt)}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">
            {cycle.solvedCount} / {cycle.totalExercises} solved
          </p>
          <Progress
            value={cycle.solvedCount}
            max={cycle.totalExercises}
            className="mt-1 h-2"
          />
        </div>
        <Button onClick={onContinue}>Continue Training</Button>
      </CardContent>
    </Card>
  );
}
