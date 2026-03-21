"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { formatSessionTime } from "@/lib/session-time-format";
import { formatCycleProgressLabel } from "@/features/session-summary/session-summary-helpers";
import {
  getSessionSummaryForSession,
  type SessionSummaryData,
} from "@/services/session-summary.service";

function parseIsoDate(iso: string | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function exerciseWord(count: number): string {
  return count === 1 ? "exercise" : "exercises";
}

export function SessionSummaryView() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [data, setData] = React.useState<SessionSummaryData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!sessionId) {
        setError("missing_session");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const summary = await getSessionSummaryForSession(sessionId);
        if (cancelled) return;
        if (!summary) {
          setError("not_found");
        } else {
          setData(summary);
        }
      } catch {
        if (!cancelled) setError("load_failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error === "missing_session" || !sessionId) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8">
        <p className="text-sm text-muted-foreground">
          No session to summarize. Continue from training when you end a session.
        </p>
        <Button asChild variant="default">
          <Link href={ROUTES.training}>Continue training</Link>
        </Button>
      </div>
    );
  }

  if (error === "not_found" || error === "load_failed" || !data) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load this session summary. It may have been removed or is
          unavailable.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="default">
            <Link href={ROUTES.training}>Continue training</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.app}>Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const startedAt = parseIsoDate(data.session.startedAt);
  const startedFriendly = startedAt != null ? formatSessionTime(startedAt) : null;
  const startedMetaLine = startedFriendly != null ? `Started ${startedFriendly}` : null;

  const hideCycleVolumeRow = data.sessionsInCycleCount === 1;
  // Same session is the only contributor → cycle totals match “This session”; skip duplicate rows.
  const hideCycleTimeRow = data.sessionsInCycleCount === 1;

  const progressTotal = data.cycle.totalExercises;
  const progressPosition = data.cycle.nextExerciseIndex;
  const progressLabel = formatCycleProgressLabel(progressPosition, progressTotal);
  const progressMax = progressTotal > 0 ? progressTotal : 100;
  const progressValue =
    progressTotal > 0 ? Math.min(Math.max(0, progressPosition), progressTotal) : 0;

  const identityLine = [
    `${data.trainingSetName} · Cycle ${data.cycle.cycleNumber}`,
    data.sessionsInCycleCount > 1 ? `Session ${data.sessionIndexInCycle}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 pb-10 pt-2">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Session summary
        </h1>
        <p className="text-sm font-medium leading-snug text-foreground/90">
          Short sessions build strong patterns.
        </p>
        <p className="text-xs text-muted-foreground">{identityLine}</p>
      </header>

      <section className="space-y-3">
        <Card className="border-border/60 bg-muted/5 shadow-none">
          <CardHeader className="space-y-1 pb-4 pt-6">
            <CardTitle className="text-base font-medium text-foreground">
              This session
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              This view focuses on time and volume.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-6 pb-6 pt-0">
            <div className="space-y-2">
              <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
                {formatDurationMs(data.session.activeTimeMs)}
              </p>
              <p className="text-sm text-muted-foreground">Time spent</p>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <div className="space-y-2">
                <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
                  {data.session.exercisesCompleted}{" "}
                  <span className="font-semibold text-muted-foreground">
                    {exerciseWord(data.session.exercisesCompleted)}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Exercises processed
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
                  {data.session.skippedCount}{" "}
                  <span className="font-semibold text-muted-foreground">
                    {exerciseWord(data.session.skippedCount)}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">Skipped</p>
              </div>
            </div>
            {startedMetaLine != null && (
              <p className="text-xs leading-snug text-muted-foreground/90">
                {startedMetaLine}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-muted/5 shadow-none">
          <CardHeader className="space-y-1 pb-4 pt-6">
            <CardTitle className="text-base font-medium text-foreground">
              Current cycle
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Your progress in the current cycle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6 pt-0">
            <div className="space-y-2.5">
              <Progress
                value={progressValue}
                max={progressMax}
                className="h-1.5 bg-muted/80"
              />
              <p className="text-xs tabular-nums text-muted-foreground">
                {progressLabel}
              </p>
            </div>

            {!hideCycleVolumeRow && (
              <div className="space-y-1">
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {data.cycle.totalExercisesCompletedInCycle}{" "}
                  <span className="text-base font-medium text-muted-foreground">
                    {exerciseWord(data.cycle.totalExercisesCompletedInCycle)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Exercises processed so far
                </p>
              </div>
            )}

            {!hideCycleTimeRow && (
              <div className="space-y-1">
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {formatDurationMs(data.cycle.totalActiveTimeMsInCycle)}
                </p>
                <p className="text-xs text-muted-foreground">Total time invested</p>
              </div>
            )}

            {data.previousCycle != null && (
              <p className="text-xs leading-relaxed text-muted-foreground/85">
                Previous cycle · about{" "}
                {formatDurationMs(data.previousCycle.totalActiveTimeMs)} total time
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
        <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-44">
          <Link href={ROUTES.training}>Continue training</Link>
        </Button>

        <Button
          asChild
          variant="ghost"
          className="w-full self-start text-muted-foreground hover:text-foreground sm:w-auto"
        >
          <Link href={ROUTES.progress}>View progress</Link>
        </Button>
      </div>
    </div>
  );
}
