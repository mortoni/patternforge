"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { TrainingSetOverview } from "../types";

function setsDetailPath(id: string) {
  return `/app/sets/${id}`;
}

const DIFFICULTY_STYLES: Record<
  TrainingSetOverview["difficulty"],
  string
> = {
  easy: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  intermediate: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  advanced: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  custom: "bg-[var(--muted)] text-[var(--muted-foreground)]",
};

function cycleStatusText(overview: TrainingSetOverview): string {
  if (overview.cycleStatus === "active" && overview.currentCycleNumber != null) {
    return `Cycle ${overview.currentCycleNumber} • Active`;
  }
  if (
    overview.cycleStatus === "completed" &&
    overview.currentCycleNumber != null
  ) {
    return `Cycle ${overview.currentCycleNumber} • Completed`;
  }
  return "No cycle started";
}

export interface TrainingSetCardProps {
  overview: TrainingSetOverview;
  onContinue: (trainingSetId: string) => Promise<void>;
  onStartCycle: (trainingSetId: string) => Promise<void>;
  className?: string;
}

export function TrainingSetCard({
  overview,
  onContinue,
  onStartCycle,
  className,
}: TrainingSetCardProps) {
  const [loading, setLoading] = React.useState(false);

  const handleAction = async () => {
    if (overview.actionLabel === "No exercises") return;
    setLoading(true);
    try {
      if (overview.actionLabel === "Continue Training") {
        await onContinue(overview.trainingSetId);
      } else if (overview.actionLabel === "Start Cycle 1" || overview.actionLabel === "Start Next Cycle") {
        await onStartCycle(overview.trainingSetId);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          <Link
            href={setsDetailPath(overview.trainingSetId)}
            className="text-[var(--primary)] hover:underline"
          >
            {overview.name}
          </Link>
        </CardTitle>
        {overview.description && (
          <CardDescription>{overview.description}</CardDescription>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span
            className={cn(
              "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
              DIFFICULTY_STYLES[overview.difficulty]
            )}
          >
            {overview.difficulty}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {overview.exerciseCount} exercises
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <p className="text-sm text-[var(--muted-foreground)]">
          {cycleStatusText(overview)}
        </p>
        {overview.totalExercises > 0 ? (
          <>
            <p className="text-sm font-medium">
              {overview.solvedCount} / {overview.totalExercises} solved
            </p>
            <Progress value={overview.solvedCount} max={overview.totalExercises} />
          </>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">No exercises yet</p>
        )}
      </CardContent>
      <CardFooter className="pt-4">
        <Button
          onClick={handleAction}
          disabled={loading || overview.actionLabel === "No exercises"}
          className="w-full"
          asChild={false}
        >
          {loading ? "…" : overview.actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
