"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { formatDateAu } from "@/lib/format-date";
import { formatDurationMs } from "@/lib/format-duration";
import { cycleSummaryRoute } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AnalyticsCycleHistoryRow } from "@/services/analytics-page.service";

export interface CycleHistoryTableProps {
  rows: AnalyticsCycleHistoryRow[];
  /** When false, omit outer border wrapper (e.g. Reflection page). */
  bordered?: boolean;
  /** When false, hide Training set (single-set / filtered context). */
  showTrainingSetColumn?: boolean;
}

export function CycleHistoryTable({
  rows,
  bordered = true,
  showTrainingSetColumn = true,
}: CycleHistoryTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-xs leading-relaxed text-muted-foreground">
        No completed cycles yet. Finish a cycle from Training Sets to see it
        here.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg",
        bordered && "border border-border/60"
      )}
    >
      <table
        className={cn(
          "w-full text-left text-sm",
          showTrainingSetColumn ? "min-w-[640px]" : "min-w-[480px]"
        )}
      >
        <thead>
          <tr className="border-b border-border/60 bg-muted/20 text-xs font-medium text-muted-foreground">
            <th className="px-4 py-3">Cycle</th>
            {showTrainingSetColumn ? (
              <th className="px-4 py-3">Training set</th>
            ) : null}
            <th className="px-4 py-3 text-right tabular-nums">Time</th>
            <th className="px-4 py-3 text-right tabular-nums">Sessions</th>
            <th className="px-4 py-3">Completed</th>
            <th className="px-4 py-3 text-right">Summary</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const summaryHref = cycleSummaryRoute(row.cycleId);
            return (
              <tr
                key={row.cycleId}
                className="border-b border-border/40 last:border-0 hover:bg-muted/10"
              >
                <td className="px-4 py-3 font-medium tabular-nums text-foreground">
                  {row.cycleNumber}
                </td>
                {showTrainingSetColumn ? (
                  <td className="px-4 py-3 text-foreground">
                    {row.trainingSetName}
                  </td>
                ) : null}
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {formatDurationMs(row.totalTimeMs)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {row.sessionCount}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.completedAt != null
                    ? formatDateAu(row.completedAt)
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={summaryHref}
                    className="inline-flex items-center justify-end rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    title="Cycle summary"
                  >
                    <span className="sr-only">View cycle summary</span>
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
