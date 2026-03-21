"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ROUTES } from "@/lib/constants";
import { formatDurationMs } from "@/lib/format-duration";
import {
  cycleProgressPercentRounded,
  formatCycleProgressLabel,
} from "@/features/session-summary/session-summary-helpers";
import { getAnalyticsPageData } from "@/services/analytics-page.service";
import { CurrentCycleSessionsChart } from "./current-cycle-sessions-chart";
import { CycleHistoryTable } from "./cycle-history-table";

/** Under ~5m active time — encouragement without implying “too little”. */
const LAST_SESSION_SHORT_MAX_MS = 5 * 60 * 1000;
/** Through ~22m — typical sustained block before “long focus” copy. */
const LAST_SESSION_MEDIUM_MAX_MS = 22 * 60 * 1000;

function exerciseWord(n: number): string {
  return n === 1 ? "exercise" : "exercises";
}

function lastSessionFeedbackLine(activeTimeMs: number): string | null {
  if (activeTimeMs <= 0) return null;
  if (activeTimeMs < LAST_SESSION_SHORT_MAX_MS) {
    return "A quick session — consistency matters.";
  }
  if (activeTimeMs < LAST_SESSION_MEDIUM_MAX_MS) {
    return "Solid session.";
  }
  return "Great focus session.";
}

export function AnalyticsPage() {
  const [data, setData] = React.useState<Awaited<
    ReturnType<typeof getAnalyticsPageData>
  > | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void getAnalyticsPageData().then((d) => {
      if (!cancelled) setData(d);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const cc = data?.currentCycle;
  const progressTotal = cc?.totalExercises ?? 0;
  const progressPos = cc?.nextExerciseIndex ?? 0;
  const progressMax = progressTotal > 0 ? progressTotal : 100;
  const progressValue =
    progressTotal > 0
      ? Math.min(Math.max(0, progressPos), progressTotal)
      : 0;
  const progressLabel = formatCycleProgressLabel(progressPos, progressTotal);
  const progressPercent = cycleProgressPercentRounded(
    progressPos,
    progressTotal
  );
  const mistakesCount = data?.mistakesToReview ?? 0;
  const lastSessionFeedback =
    data?.lastSession != null
      ? lastSessionFeedbackLine(data.lastSession.activeTimeMs)
      : null;
  const longestRecentSessionMs = data?.longestRecentSessionMs;
  const bestRecentSessionExercises = data?.bestRecentSessionExercises;
  const showSessionHighlights =
    (longestRecentSessionMs ?? 0) > 0 || (bestRecentSessionExercises ?? 0) > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <PageHeader
        title="Analytics"
        description="Repetition, volume, and time—steady rhythm over pressure."
      />

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-8 space-y-10">
          {/* A. Last session */}
          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Last session
            </h2>
            <Card className="border-border/60 bg-muted/5 shadow-none">
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-base font-medium">
                  Most recent session
                </CardTitle>
                <CardDescription className="text-xs">
                  Time and exercises only—no accuracy breakdown.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-6 pb-6">
                {data?.lastSession == null ? (
                  <p className="text-sm text-muted-foreground">
                    No completed sessions yet. Finish a session to see it here.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-10 sm:gap-16">
                      <div className="space-y-1.5">
                        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                          {formatDurationMs(data.lastSession.activeTimeMs)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Time spent
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xl font-semibold tabular-nums text-foreground">
                          {data.lastSession.exercisesCompleted}{" "}
                          <span className="font-semibold text-muted-foreground">
                            {exerciseWord(data.lastSession.exercisesCompleted)}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Completed
                        </p>
                      </div>
                    </div>
                    {lastSessionFeedback != null && (
                      <p className="text-xs text-muted-foreground">
                        {lastSessionFeedback}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          {/* B. Current cycle */}
          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current cycle
            </h2>
            <Card className="border-border/80 bg-card shadow-sm">
              <CardHeader className="space-y-1 pb-2 pt-6">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Your progress in the current cycle
                </CardTitle>
                <CardDescription className="text-sm">
                  Where you are in the active Woodpecker cycle.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 px-6 pb-6">
                {cc == null ? (
                  <p className="text-sm text-muted-foreground">
                    No active cycle right now. Start or continue one from
                    Training Sets.
                  </p>
                ) : (
                  <>
                    <div className="space-y-1">
                      <p className="text-base font-medium text-foreground">
                        Cycle {cc.cycleNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {cc.trainingSetName}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 pb-1">
                      <Progress
                        value={progressValue}
                        max={progressMax}
                        className="h-[7px] bg-muted"
                      />
                      <p className="text-sm tabular-nums text-muted-foreground">
                        <span>{progressLabel}</span>
                        {progressPercent != null ? (
                          <span className="font-normal text-muted-foreground/70">
                            {" "}
                            ({progressPercent}%)
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-10 border-t border-border/40 pt-6 sm:gap-16">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold tabular-nums text-foreground">
                          {formatDurationMs(cc.totalTimeMs)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total time invested
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold tabular-nums text-foreground">
                          {cc.totalExercisesCompleted}{" "}
                          <span className="text-base font-medium text-muted-foreground">
                            {exerciseWord(cc.totalExercisesCompleted)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Completed in this cycle
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-border/40 pt-6">
                      <h3 className="text-sm font-medium text-foreground">
                        Training over time
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Exercises completed per session
                      </p>
                      <CurrentCycleSessionsChart data={cc.sessionBars} />
                      {cc.totalSkippedForNowInCycle > 0 ? (
                        <p className="pt-2 text-center text-xs tabular-nums text-muted-foreground/75">
                          {`${cc.totalSkippedForNowInCycle} ${exerciseWord(cc.totalSkippedForNowInCycle)} skipped for now`}
                        </p>
                      ) : null}
                    </div>

                    {showSessionHighlights ? (
                      <div className="flex flex-col gap-1 border-t border-border/40 pt-5 text-xs text-muted-foreground">
                        {longestRecentSessionMs != null &&
                          longestRecentSessionMs > 0 && (
                            <p>
                              Longest recent session:{" "}
                              {formatDurationMs(longestRecentSessionMs)}
                            </p>
                          )}
                        {bestRecentSessionExercises != null &&
                          bestRecentSessionExercises > 0 && (
                            <p>
                              Most exercises in one session (recent):{" "}
                              {bestRecentSessionExercises}
                            </p>
                          )}
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Mistakes (controlled) */}
          <section className="space-y-3">
            <Card className="border-border/60 bg-muted/5 shadow-none">
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-base font-medium">
                  Review mistakes
                </CardTitle>
                <CardDescription className="text-xs">
                  Keep reviews separate from training flow—visit when you are
                  ready.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {mistakesCount === 0
                    ? "Nothing waiting for review right now."
                    : `${mistakesCount} mistake${mistakesCount === 1 ? "" : "s"} ready for review.`}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTES.mistakes}>Go to learning room</Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* C. Cycle history */}
          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cycle history
            </h2>
            <Card className="border-border/60 bg-muted/5 shadow-none">
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-base font-medium">
                  Cycles you&apos;ve completed
                </CardTitle>
                <CardDescription className="text-xs">
                  Time and volume per finished cycle.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <CycleHistoryTable
                  rows={data?.cycleHistory ?? []}
                  activeCycleNumber={data?.currentCycle?.cycleNumber ?? null}
                />
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
