"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMistakesList } from "../hooks/use-mistakes-list";
import { MistakesTable } from "./mistakes-table";
import { MistakesMobileList } from "./mistakes-mobile-list";
import { ROUTES } from "@/lib/constants";

export function MistakesPage() {
  const { rows, summary, loading, error, reload } = useMistakesList();

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <PageHeader title="Mistakes Review" />
        <div className="flex items-center justify-center rounded-lg border border-border bg-muted/20 p-12">
          <p className="text-sm text-muted-foreground">Loading mistakes…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <PageHeader title="Mistakes Review" />
        <EmptyState title="Something went wrong" description={error.message}>
          <Button onClick={() => reload()}>Try again</Button>
        </EmptyState>
      </div>
    );
  }

  const hasActive = (summary?.activeCount ?? 0) > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <PageHeader
        title="Mistakes Review"
        description="Revisit puzzles you missed and master them through repetition."
      />

      {summary != null && (
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Mistakes Remaining"
            value={summary.activeCount}
            description="To review"
          />
          <StatCard
            label="Solved Once"
            value={summary.solvedOnce}
            description="One correct review"
          />
          <StatCard
            label="Solved Twice"
            value={summary.solvedTwice}
            description="Two correct reviews"
          />
          <StatCard
            label="Mastered"
            value={summary.mastered}
            description="Fully mastered"
          />
        </section>
      )}

      {!hasActive ? (
        <EmptyState
          title="No mistakes to review"
          description="Incorrect and skipped puzzles will appear here for later review."
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="default">
              <Link href={ROUTES.training}>Go to Training</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.sets}>Training Sets</Link>
            </Button>
          </div>
        </EmptyState>
      ) : (
        <>
          <section className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <MistakesTable rows={rows} />
              </CardContent>
            </Card>
          </section>
          <MistakesMobileList rows={rows} />
        </>
      )}
    </div>
  );
}
