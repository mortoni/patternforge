"use client";

import { cn } from "@/lib/utils";
import type { TrainingSetDetailSet } from "../types";

const DIFFICULTY_STYLES: Record<TrainingSetDetailSet["difficulty"], string> = {
  easy: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  intermediate: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  advanced: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  custom: "bg-[var(--muted)] text-[var(--muted-foreground)]",
};

export interface TrainingSetMetadataBadgesProps {
  set: TrainingSetDetailSet;
}

export function TrainingSetMetadataBadges({ set }: TrainingSetMetadataBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {set.source && (
        <span className="inline-flex rounded-md border border-[var(--border)] bg-[var(--muted)]/30 px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
          {set.source}
        </span>
      )}
      <span
        className={cn(
          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
          DIFFICULTY_STYLES[set.difficulty]
        )}
      >
        {set.difficulty}
      </span>
      {set.tags.length > 0 &&
        set.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex rounded-md border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]"
          >
            {tag}
          </span>
        ))}
    </div>
  );
}
