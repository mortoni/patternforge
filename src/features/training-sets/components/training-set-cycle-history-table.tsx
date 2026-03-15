"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { formatDateShort } from "@/lib/format-date";
import { formatDurationMs } from "@/lib/format-duration";
import type { TrainingSetDetailCycleHistoryRow } from "../types";

export interface TrainingSetCycleHistoryTableProps {
  rows: TrainingSetDetailCycleHistoryRow[];
}

export function TrainingSetCycleHistoryTable({
  rows,
}: TrainingSetCycleHistoryTableProps) {
  if (rows.length === 0) return null;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cycle</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="min-w-[100px]">Progress</TableHead>
          <TableHead>Started</TableHead>
          <TableHead>Completed</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Sessions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.cycleNumber}</TableCell>
            <TableCell>
              <span
                className={
                  row.status === "active"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-[var(--muted-foreground)]"
                }
              >
                {row.status === "active" ? "Active" : "Completed"}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1 min-w-[80px]">
                <span className="text-xs font-medium">
                  {row.solvedCount} / {row.totalExercises}
                </span>
                <Progress
                  value={row.solvedCount}
                  max={row.totalExercises}
                  className="h-1.5"
                />
              </div>
            </TableCell>
            <TableCell className="text-[var(--muted-foreground)] text-sm">
              {formatDateShort(row.startedAt)}
            </TableCell>
            <TableCell className="text-[var(--muted-foreground)] text-sm">
              {row.completedAt
                ? formatDateShort(row.completedAt)
                : "—"}
            </TableCell>
            <TableCell className="text-sm">
              {formatDurationMs(row.totalTimeMs)}
            </TableCell>
            <TableCell>{row.sessionCount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
