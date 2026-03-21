"use client";

import { formatDateShort } from "@/lib/format-date";
import { formatDurationMs } from "@/lib/format-duration";
import type { AnalyticsCycleHistoryRow } from "@/services/analytics-page.service";

export interface CycleHistoryTableProps {
  rows: AnalyticsCycleHistoryRow[];
  /** Active Woodpecker cycle number, when any; refines empty copy only. */
  activeCycleNumber?: number | null;
}

export function CycleHistoryTable({
  rows,
  activeCycleNumber = null,
}: CycleHistoryTableProps) {
  if (rows.length === 0) {
    const primary =
      activeCycleNumber === 1
        ? "You're in your first cycle. Complete it to unlock your history."
        : "Cycle history will appear once your first cycle is complete.";
    return (
      <div className="space-y-2">
        <p className="text-xs leading-relaxed text-muted-foreground">{primary}</p>
        {activeCycleNumber != null ? (
          <p className="text-xs text-muted-foreground/80">
            Cycle {activeCycleNumber} in progress
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/20 text-xs font-medium text-muted-foreground">
            <th className="px-4 py-3">Cycle</th>
            <th className="px-4 py-3">Training set</th>
            <th className="px-4 py-3 text-right tabular-nums">Time</th>
            <th className="px-4 py-3 text-right tabular-nums">Exercises</th>
            <th className="px-4 py-3">Completed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.cycleId}
              className="border-b border-border/40 last:border-0 hover:bg-muted/10"
            >
              <td className="px-4 py-3 font-medium tabular-nums text-foreground">
                {row.cycleNumber}
              </td>
              <td className="px-4 py-3 text-foreground">{row.trainingSetName}</td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {formatDurationMs(row.totalTimeMs)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {row.totalExercisesCompleted}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.completedAt != null
                  ? formatDateShort(row.completedAt)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
