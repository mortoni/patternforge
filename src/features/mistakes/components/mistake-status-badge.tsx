"use client";

import { cn } from "@/lib/utils";
import type { MistakeStatus } from "../types";

const STATUS_STYLES: Record<MistakeStatus, string> = {
  needs_review: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  solved_once: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  solved_twice: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  mastered: "bg-[var(--muted)] text-muted-foreground",
};

const STATUS_LABELS: Record<MistakeStatus, string> = {
  needs_review: "Needs review",
  solved_once: "Solved once",
  solved_twice: "Solved twice",
  mastered: "Mastered",
};

export interface MistakeStatusBadgeProps {
  status: MistakeStatus;
  className?: string;
}

export function MistakeStatusBadge({ status, className }: MistakeStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
