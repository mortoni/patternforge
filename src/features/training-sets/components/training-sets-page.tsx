"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrainingSetsTable } from "./training-sets-table";
import { TrainingSetsMobileList } from "./training-sets-mobile-list";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ensureSeededForDevelopment,
  getTrainingSetsOverview,
  continueTraining,
  startNextCycle,
  resetAllAndLoadGenerated,
} from "../services/training-sets.service";
import { mapOverviewToTableRow, dedupeTableRows } from "../lib/map-training-set-row";
import type { TrainingSetOverview } from "../types";

const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";

export function TrainingSetsPage() {
  const router = useRouter();
  const [overviews, setOverviews] = React.useState<TrainingSetOverview[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = React.useState<string>("all");
  const [loadingGenerated, setLoadingGenerated] = React.useState(false);

  const loadOverviews = React.useCallback(async () => {
    const list = await getTrainingSetsOverview();
    setOverviews(list);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        await ensureSeededForDevelopment();
        if (cancelled) return;
        await loadOverviews();
      } catch {
        if (!cancelled) setOverviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [loadOverviews]);

  const handleContinue = React.useCallback(
    async (trainingSetId: string) => {
      const result = await continueTraining(trainingSetId);
      if (result.success) router.push(result.route);
    },
    [router]
  );

  const handleStartCycle = React.useCallback(
    async (trainingSetId: string) => {
      const result = await startNextCycle(trainingSetId);
      if (result.success) router.push(result.route);
    },
    [router]
  );

  const handleResetAllAndLoadGenerated = React.useCallback(async () => {
    if (!isDev) return;
    setLoadingGenerated(true);
    try {
      const result = await resetAllAndLoadGenerated();
      await loadOverviews();
      console.log(
        `[reset] Loaded ${result.trainingSets} sets, ${result.exercises} exercises — reloading`
      );
      window.location.reload();
    } catch (e) {
      console.error("Reset & load generated failed:", e);
      window.alert(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingGenerated(false);
    }
  }, [loadOverviews]);

  const tableRows = React.useMemo(() => {
    if (!overviews?.length) return [];
    return dedupeTableRows(overviews.map(mapOverviewToTableRow));
  }, [overviews]);

  const filteredRows = React.useMemo(() => {
    return tableRows.filter((row) => {
      if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
      if (difficultyFilter !== "all" && row.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [tableRows, sourceFilter, difficultyFilter]);

  const filteredOverviews = React.useMemo(() => {
    if (!overviews?.length) return [];
    const ids = new Set(filteredRows.map((r) => r.id));
    return overviews.filter((o) => ids.has(o.trainingSetId));
  }, [overviews, filteredRows]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <PageHeader
          title="Training Sets"
          description="Browse and manage your training sets."
        />
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[var(--muted-foreground)]">
            Loading training sets…
          </p>
        </div>
      </div>
    );
  }

  if (overviews?.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <PageHeader
          title="Training Sets"
          description="Browse and manage your training sets."
        />
        <EmptyState
          title="No training sets"
          description="Create or import a set to get started."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Training Sets"
        description="Browse and manage your training sets."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-4">
        <Input
          type="search"
          placeholder="Search sets…"
          aria-label="Search training sets"
          className="max-w-xs"
        />
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]" aria-label="Filter by source">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="Lichess">Lichess</SelectItem>
            <SelectItem value="Custom">Custom</SelectItem>
            <SelectItem value="Unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[180px]" aria-label="Filter by difficulty">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulties</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        {isDev && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingGenerated}
                className="ml-auto border-amber-500/50 text-amber-600 dark:text-amber-400"
              >
                {loadingGenerated ? "Resetting…" : "Reset everything & load generated"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset everything & load generated?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset ALL user data (progress, cycles, sessions) and replace
                  training sets with the 3 sets from data/generated. Run{" "}
                  <code className="rounded bg-[var(--muted)] px-1 py-0.5 text-xs">pnpm run refresh-data</code>{" "}
                  first if you changed puzzle.csv.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void handleResetAllAndLoadGenerated()}
                  className="border-amber-500/50 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                >
                  Reset & load generated
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="hidden md:block rounded-md border border-[var(--border)]">
        <TrainingSetsTable
          rows={filteredRows}
          onContinue={handleContinue}
          onStartCycle={handleStartCycle}
        />
      </div>

      <TrainingSetsMobileList
        overviews={filteredOverviews}
        onContinue={handleContinue}
        onStartCycle={handleStartCycle}
      />
    </div>
  );
}
