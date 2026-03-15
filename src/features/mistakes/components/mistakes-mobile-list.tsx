"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MistakeStatusBadge } from "./mistake-status-badge";
import { cn } from "@/lib/utils";
import type { MistakeListRow } from "../types";
import { ROUTES } from "@/lib/constants";

function formatLastReviewed(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  intermediate: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  advanced: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  custom: "bg-muted text-muted-foreground",
};

export interface MistakesMobileListProps {
  rows: MistakeListRow[];
}

export function MistakesMobileList({ rows }: MistakesMobileListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {rows.map((row) => (
        <Card key={row.id}>
          <CardHeader className="pb-2">
            <p className="font-medium">{row.puzzleLabel}</p>
            <p className="text-sm text-muted-foreground">{row.trainingSetName}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                  DIFFICULTY_STYLES[row.difficulty] ?? DIFFICULTY_STYLES.custom
                )}
              >
                {row.difficulty}
              </span>
              <MistakeStatusBadge status={row.status} />
              <span className="text-muted-foreground">
                Failed: {row.failedAttempts} · {formatLastReviewed(row.lastReviewedAt)}
              </span>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`${ROUTES.mistakes}/${row.id}`}>Review Puzzle</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
