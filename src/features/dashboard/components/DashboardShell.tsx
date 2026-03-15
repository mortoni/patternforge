"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { PlaceholderCard } from "@/components/shared/PlaceholderCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ROUTES } from "@/lib/constants";
import { getContinueTrainingCard } from "../services/dashboard.service";
import { getDashboardStats } from "@/services/analytics.service";
import { DashboardStatsGrid } from "./dashboard-stats-grid";
import { RecentSessionsList } from "./recent-sessions-list";

export function DashboardShell() {
  const [continueCard, setContinueCard] = React.useState<{
    trainingSetId: string;
    name: string;
    cycleNumber: number;
    solvedCount: number;
    totalExercises: number;
  } | null>(null);
  const [dashboardStats, setDashboardStats] = React.useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      getContinueTrainingCard(),
      getDashboardStats(10),
    ]).then(([card, stats]) => {
      if (!cancelled) {
        setContinueCard(card ?? null);
        setDashboardStats(stats);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your training progress."
      />
      <div className="space-y-6">
        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Loading…
          </p>
        ) : continueCard ? (
          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">
              Continue training
            </h2>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{continueCard.name}</CardTitle>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Cycle {continueCard.cycleNumber} • Active
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">
                  {continueCard.solvedCount} / {continueCard.totalExercises} solved
                </p>
                <Progress
                  value={continueCard.solvedCount}
                  max={continueCard.totalExercises}
                />
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href={ROUTES.training}>Continue Training</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/app/sets/${continueCard.trainingSetId}`}>
                      View set
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : (
          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">
              Get started
            </h2>
            <PlaceholderCard
              title="No active training"
              description="Pick a training set to start or continue."
            >
              <Button asChild>
                <Link href={ROUTES.sets}>Choose training set</Link>
              </Button>
            </PlaceholderCard>
          </section>
        )}
        {!loading && dashboardStats != null && dashboardStats.mistakesRemaining > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">
              Mistakes
            </h2>
            <Card>
              <CardContent className="flex flex-row items-center justify-between py-4">
                <p className="text-sm font-medium">
                  {dashboardStats.mistakesRemaining} mistake{dashboardStats.mistakesRemaining !== 1 ? "s" : ""} to review
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTES.mistakes}>Review Mistakes</Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">
            Quick stats
          </h2>
          {loading ? (
            <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
          ) : (
            <DashboardStatsGrid stats={dashboardStats} />
          )}
        </section>
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">
            Recent sessions
          </h2>
          {loading ? (
            <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
          ) : (
            <RecentSessionsList sessions={dashboardStats?.recentSessions ?? []} />
          )}
        </section>
      </div>
    </>
  );
}
