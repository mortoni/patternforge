"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatDurationMs } from "@/lib/format-duration";
import { formatPercentageFromFraction } from "@/lib/format-percentage";
import { formatDateRelative } from "@/lib/format-date";
import type { RecentSessionRow } from "@/services/analytics.service";

export interface RecentSessionsListProps {
  sessions: RecentSessionRow[];
}

export function RecentSessionsList({ sessions }: RecentSessionsListProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/10 p-6 text-center">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">
          No sessions yet
        </p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Complete a training cycle to see recent sessions here.
        </p>
        <Link
          href={ROUTES.training}
          className="mt-3 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Go to Training
        </Link>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {sessions.map((s) => (
        <li
          key={s.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium">{s.trainingSetName}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {formatDateRelative(s.endedAt)} · {s.puzzlesAttempted} attempted
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
            <span>
              {formatPercentageFromFraction(s.accuracy, 0)} correct
            </span>
            <span>{formatDurationMs(s.activeTimeMs)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
