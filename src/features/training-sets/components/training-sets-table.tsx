"use client";

import * as React from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { TrainingSetTableRow as Row } from "../types";

function setsDetailPath(id: string) {
  return `/app/sets/${id}`;
}

const DIFFICULTY_STYLES: Record<Row["difficulty"], string> = {
  easy: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  intermediate: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  advanced: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  custom: "bg-[var(--muted)] text-[var(--muted-foreground)]",
};

export interface TrainingSetsTableProps {
  rows: Row[];
  onContinue: (id: string) => Promise<void>;
  onStartCycle: (id: string) => Promise<void>;
}

export function TrainingSetsTable({
  rows,
  onContinue,
  onStartCycle,
}: TrainingSetsTableProps) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handleAction = async (row: Row) => {
    if (row.actionLabel === "No exercises") return;
    setLoadingId(row.id);
    try {
      if (row.actionLabel === "Continue Training") {
        await onContinue(row.id);
      } else if (row.actionLabel === "Start Cycle 1" || row.actionLabel === "Start Next Cycle") {
        await onStartCycle(row.id);
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="hidden md:table-cell">Source</TableHead>
          <TableHead>Difficulty</TableHead>
          <TableHead className="hidden lg:table-cell">Tags</TableHead>
          <TableHead className="text-right">Exercises</TableHead>
          <TableHead className="hidden sm:table-cell">Status</TableHead>
          <TableHead className="hidden md:table-cell">Current Cycle</TableHead>
          <TableHead className="min-w-[100px]">Progress</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div>
                <Link
                  href={setsDetailPath(row.id)}
                  className="font-medium text-[var(--primary)] hover:underline"
                >
                  {row.name}
                </Link>
                {row.description && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {row.description}
                  </p>
                )}
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell text-[var(--muted-foreground)]">
              {row.source}
            </TableCell>
            <TableCell>
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                  DIFFICULTY_STYLES[row.difficulty]
                )}
              >
                {row.difficulty}
              </span>
            </TableCell>
            <TableCell className="hidden lg:table-cell text-sm text-[var(--muted-foreground)]">
              {row.tags.length > 0 ? row.tags.join(", ") : "—"}
            </TableCell>
            <TableCell className="text-right">{row.exerciseCount}</TableCell>
            <TableCell className="hidden sm:table-cell">{row.status}</TableCell>
            <TableCell className="hidden md:table-cell text-[var(--muted-foreground)]">
              {row.currentCycleLabel}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1 min-w-[80px]">
                {row.totalExercises > 0 ? (
                  <>
                    <span className="text-xs font-medium">
                      {row.solvedCount} / {row.totalExercises}
                    </span>
                    <Progress value={row.solvedCount} max={row.totalExercises} className="h-1.5" />
                  </>
                ) : (
                  <span className="text-xs text-[var(--muted-foreground)]">No exercises yet</span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                onClick={() => handleAction(row)}
                disabled={loadingId !== null || row.actionLabel === "No exercises"}
              >
                {loadingId === row.id ? "…" : row.actionLabel}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
