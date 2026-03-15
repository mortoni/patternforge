"use client";

import { formatDateShort } from "@/lib/format-date";
import { formatDurationMs } from "@/lib/format-duration";
import type { TrainingSetDetailCycleHistoryRow } from "../types";

export interface TrainingSetCycleHistoryMobileProps {
  rows: TrainingSetDetailCycleHistoryRow[];
}

export function TrainingSetCycleHistoryMobile({
  rows,
}: TrainingSetCycleHistoryMobileProps) {
  if (rows.length === 0) return null;
  return (
    <ul className="space-y-2 md:hidden">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              Cycle {row.cycleNumber} · {row.status === "active" ? "Active" : "Completed"}
            </p>
            <span className="text-xs text-[var(--muted-foreground)]">
              {row.solvedCount} / {row.totalExercises}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
            <span>Started {formatDateShort(row.startedAt)}</span>
            {row.completedAt && (
              <span>Completed {formatDateShort(row.completedAt)}</span>
            )}
            <span>{formatDurationMs(row.totalTimeMs)}</span>
            <span>{row.sessionCount} session(s)</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
