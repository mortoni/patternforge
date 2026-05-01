"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDurationMs } from "@/lib/format-duration";
import {
  cycleProgressPercentRounded,
  formatCycleProgressLabel,
} from "@/features/session-summary/session-summary-helpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getProgressPageData,
  type AnalyticsCycleHistoryRow,
} from "@/services/analytics-page.service";
import { CurrentCycleSessionsChart } from "./current-cycle-sessions-chart";
import { CycleHistoryTable } from "./cycle-history-table";
import { ReflectionCyclesTimeChart } from "./reflection-cycles-time-chart";

function exerciseWord(n: number): string {
  return n === 1 ? "exercise" : "exercises";
}

type ReflectionView = "table" | "chart";

type ReflectionSetGroup = {
  id: string;
  name: string;
  rows: AnalyticsCycleHistoryRow[];
};

export function ProgressPage() {
  const [data, setData] = React.useState<Awaited<
    ReturnType<typeof getProgressPageData>
  > | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reflectionView, setReflectionView] = React.useState<ReflectionView>("table");

  React.useEffect(() => {
    let cancelled = false;
    void getProgressPageData()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reflectionSetGroups = React.useMemo((): ReflectionSetGroup[] => {
    const rows = data?.cycleHistory;
    if (rows == null || rows.length === 0) return [];
    const map = new Map<
      string,
      { id: string; name: string; rows: AnalyticsCycleHistoryRow[] }
    >();
    for (const row of rows) {
      let g = map.get(row.trainingSetId);
      if (!g) {
        g = {
          id: row.trainingSetId,
          name: row.trainingSetName,
          rows: [],
        };
        map.set(row.trainingSetId, g);
      }
      g.rows.push(row);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [data?.cycleHistory]);

  const [reflectionTrainingSetId, setReflectionTrainingSetId] = React.useState<
    string | null
  >(null);

  const reflectionEffectiveSetId = React.useMemo(() => {
    if (reflectionSetGroups.length === 0) return null;
    if (
      reflectionTrainingSetId != null &&
      reflectionSetGroups.some((g) => g.id === reflectionTrainingSetId)
    ) {
      return reflectionTrainingSetId;
    }
    return reflectionSetGroups[0]!.id;
  }, [reflectionSetGroups, reflectionTrainingSetId]);

  const reflectionSelectedGroup = React.useMemo(() => {
    if (reflectionEffectiveSetId == null) return null;
    return reflectionSetGroups.find((g) => g.id === reflectionEffectiveSetId) ?? null;
  }, [reflectionSetGroups, reflectionEffectiveSetId]);

  const reflectionTableRows = React.useMemo(() => {
    const rows = reflectionSelectedGroup?.rows ?? [];
    return [...rows].sort((a, b) => b.cycleNumber - a.cycleNumber);
  }, [reflectionSelectedGroup]);

  const reflectionChartRows = React.useMemo(() => {
    const rows = reflectionSelectedGroup?.rows ?? [];
    return [...rows].sort((a, b) => {
      const n = a.cycleNumber - b.cycleNumber;
      if (n !== 0) return n;
      return (a.completedAt ?? "").localeCompare(b.completedAt ?? "");
    });
  }, [reflectionSelectedGroup]);

  const reflectionChartEnabled = (reflectionSelectedGroup?.rows.length ?? 0) >= 2;

  React.useEffect(() => {
    if (!reflectionChartEnabled && reflectionView === "chart") {
      setReflectionView("table");
    }
  }, [reflectionChartEnabled, reflectionView]);

  const cc = data?.currentCycle;
  const hasActiveCycle = cc != null;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (hasActiveCycle && cc != null) {
    const progressTotal = cc.totalExercises;
    const progressPos = cc.nextExerciseIndex;
    const progressMax = progressTotal > 0 ? progressTotal : 100;
    const progressValue = Math.min(Math.max(0, progressPos), progressTotal);
    const progressLabel = formatCycleProgressLabel(progressPos, progressTotal);
    const progressPercent = cycleProgressPercentRounded(progressPos, progressTotal);

    return (
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
        <PageHeader
          title="Progress"
          description="Track your current cycle across sessions."
        />

        <div className="mt-8 space-y-10">
          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current cycle
            </h2>
            <Card className="border-border/80 bg-card shadow-sm">
              <CardHeader className="space-y-1 pb-2 pt-6">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Cycle {cc.cycleNumber}
                </CardTitle>
                <CardDescription className="text-sm">
                  {cc.trainingSetName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-6 pb-6">
                <div className="space-y-3">
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
                <div className="flex flex-wrap gap-8 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                      {cc.exercisesRemaining}{" "}
                      <span className="font-medium text-muted-foreground">
                        {exerciseWord(cc.exercisesRemaining)}
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sessions
            </h2>
            <Card className="border-border/60 bg-muted/5 shadow-none">
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-base font-medium">This cycle</CardTitle>
                <CardDescription className="text-xs">
                  Time and session count for your active cycle.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-10 px-6 pb-6 sm:gap-16">
                <div className="space-y-1">
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                    {cc.sessionCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Sessions</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                    {formatDurationMs(cc.totalTimeMs)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total time invested</p>
                </div>
                {cc.averageSessionTimeMs != null ? (
                  <div className="space-y-1">
                    <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                      {formatDurationMs(cc.averageSessionTimeMs)}
                    </p>
                    <p className="text-sm text-muted-foreground">Average per session</p>
                  </div>
                ) : null}
                {cc.longestSessionMs > 0 ? (
                  <div className="space-y-1">
                    <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                      {formatDurationMs(cc.longestSessionMs)}
                    </p>
                    <p className="text-sm text-muted-foreground">Longest session</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Session activity
            </h2>
            <Card className="border-border/60 bg-muted/5 shadow-none">
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-base font-medium">
                  Exercises per session
                </CardTitle>
                <CardDescription className="text-xs">
                  Volume completed in each session of this cycle.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <CurrentCycleSessionsChart data={cc.sessionBars} />
                {cc.totalSkippedForNowInCycle > 0 ? (
                  <p className="pt-2 text-center text-xs tabular-nums text-muted-foreground/75">
                    {`${cc.totalSkippedForNowInCycle} ${exerciseWord(cc.totalSkippedForNowInCycle)} skipped for now`}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    );
  }

  const historyRowsAll = data?.cycleHistory ?? [];
  const showReflectionToggle = historyRowsAll.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <PageHeader
        title="Reflection"
        description="Review completed cycles and revisit your training history."
      />

      <section className="mt-10 w-full min-w-0 space-y-4 [&>*]:w-full [&>*]:min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Completed cycles
          </h2>
          {showReflectionToggle ? (
            <div
              className="inline-flex w-fit rounded-md border border-border/60 p-0.5"
              role="group"
              aria-label="Completed cycles view"
            >
              <button
                type="button"
                onClick={() => setReflectionView("table")}
                className={cn(
                  "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                  reflectionView === "table"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setReflectionView("chart")}
                disabled={!reflectionChartEnabled}
                title={
                  !reflectionChartEnabled
                    ? "Complete at least two cycles for this training set to see a chart."
                    : undefined
                }
                className={cn(
                  "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                  reflectionView === "chart" && reflectionChartEnabled
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  !reflectionChartEnabled &&
                    "cursor-not-allowed opacity-50 hover:text-muted-foreground"
                )}
              >
                Chart
              </button>
            </div>
          ) : null}
        </div>

        {showReflectionToggle ? (
          <div className="w-full min-w-0 space-y-1.5">
            <label
              htmlFor="reflection-training-set"
              className="block text-xs font-medium text-muted-foreground"
            >
              Training set
            </label>
            <div className="w-full min-w-0 max-w-full sm:max-w-sm">
              <Select
                value={reflectionEffectiveSetId ?? undefined}
                onValueChange={setReflectionTrainingSetId}
              >
                <SelectTrigger
                  id="reflection-training-set"
                  className="h-9 w-full min-w-0"
                >
                  <SelectValue placeholder="Select a training set" />
                </SelectTrigger>
                <SelectContent>
                  {reflectionSetGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {reflectionView === "table" || !reflectionChartEnabled ? (
          <Card className="w-full min-w-0 border-border/60 bg-muted/5 shadow-none">
            <CardContent className="min-w-0 px-4 py-4 md:px-6 md:py-5">
              <CycleHistoryTable
                rows={reflectionTableRows}
                bordered={false}
                showTrainingSetColumn={false}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full min-w-0 border-border/60 bg-muted/5 shadow-none">
            <CardContent className="min-w-0 px-4 py-4 md:px-6 md:py-5">
              <ReflectionCyclesTimeChart rows={reflectionChartRows} />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
