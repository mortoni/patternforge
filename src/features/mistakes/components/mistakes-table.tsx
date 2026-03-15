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
      year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
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

export interface MistakesTableProps {
  rows: MistakeListRow[];
}

export function MistakesTable({ rows }: MistakesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Puzzle</TableHead>
          <TableHead className="hidden md:table-cell">Training Set</TableHead>
          <TableHead>Difficulty</TableHead>
          <TableHead className="hidden sm:table-cell text-right">Failed</TableHead>
          <TableHead className="hidden lg:table-cell">Status</TableHead>
          <TableHead className="hidden md:table-cell">Last Reviewed</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.puzzleLabel}</TableCell>
            <TableCell className="hidden md:table-cell text-muted-foreground">
              {row.trainingSetName}
            </TableCell>
            <TableCell>
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                  DIFFICULTY_STYLES[row.difficulty] ?? DIFFICULTY_STYLES.custom
                )}
              >
                {row.difficulty}
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-right text-muted-foreground">
              {row.failedAttempts}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <MistakeStatusBadge status={row.status} />
            </TableCell>
            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
              {formatLastReviewed(row.lastReviewedAt)}
            </TableCell>
            <TableCell className="text-right">
              <Button asChild variant="outline" size="sm">
                <Link href={`${ROUTES.mistakes}/${row.id}`}>Review Puzzle</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
