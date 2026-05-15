"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrainingSetsTable } from "./training-sets-table";
import { TrainingSetsMobileList } from "./training-sets-mobile-list";
import { Button } from "@/components/ui/button";
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
  ensureGeneratedPuzzlesInDbIfEmpty,
  ensureSeededForDevelopment,
  getTrainingSetsOverview,
  continueTraining,
  startNextCycle,
  resetAllAndLoadGenerated,
  upsertDevWoodpeckerEasyFive,
} from "../services/training-sets.service";
import { mapOverviewToTableRow, dedupeTableRows } from "../lib/map-training-set-row";
import type { TrainingSetOverview } from "../types";

/** Dev-only UI (e.g. reset seed data). Omitted from production builds. */
const isDev =
  typeof process !== "undefined" && process.env.NODE_ENV === "development";

export function TrainingSetsPage() {
  const router = useRouter();
  const [overviews, setOverviews] = React.useState<TrainingSetOverview[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingGenerated, setLoadingGenerated] = React.useState(false);
  const [loadingDevFive, setLoadingDevFive] = React.useState(false);

  const loadOverviews = React.useCallback(async () => {
    const list = await getTrainingSetsOverview();
    setOverviews(list);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        await ensureGeneratedPuzzlesInDbIfEmpty();
        if (cancelled) return;
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
      console.error("Reset & load Woodpecker bundles failed:", e);
      window.alert(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingGenerated(false);
    }
  }, [loadOverviews]);

  const handleUpsertDevWoodpeckerEasyFive = React.useCallback(async () => {
    if (!isDev) return;
    setLoadingDevFive(true);
    try {
      const result = await upsertDevWoodpeckerEasyFive();
      await loadOverviews();
      console.log(
        `[dev] Upserted Woodpecker Easy (dev · 5): ${result.trainingSets} set, ${result.exercises} exercises`
      );
    } catch (e) {
      console.error("Upsert dev Woodpecker Easy ×5 failed:", e);
      window.alert(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingDevFive(false);
    }
  }, [loadOverviews]);

  const tableRows = React.useMemo(() => {
    if (!overviews?.length) return [];
    return dedupeTableRows(overviews.map(mapOverviewToTableRow));
  }, [overviews]);

  const displayedOverviews = React.useMemo(() => {
    if (!overviews?.length) return [];
    const ids = new Set(tableRows.map((r) => r.id));
    return overviews.filter((o) => ids.has(o.trainingSetId));
  }, [overviews, tableRows]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <PageHeader
          title="Training Sets"
          description="Start a new training cycle or continue your active one."
        />
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
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
          description="Start a new training cycle or continue your active one."
        />
        <EmptyState
          title="No training sets"
          description="Import or create a set to start a new training cycle."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Training Sets"
        description="Start a new training cycle or continue your active one."
      />

      <div className="mt-6 flex flex-col gap-6">
      {isDev && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-border pb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingDevFive || loadingGenerated}
            className="border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
            onClick={() => void handleUpsertDevWoodpeckerEasyFive()}
          >
            {loadingDevFive ? "Adding…" : "Upsert Woodpecker Easy (dev · 5)"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingGenerated}
                className="border-amber-500/50 text-amber-600 dark:text-amber-400"
              >
                {loadingGenerated ? "Resetting…" : "Reset everything & load Woodpecker bundles"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset everything & load Woodpecker bundles?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset ALL user data (progress, cycles, sessions) and replace
                  training sets with the 3 sets from public/data/woodpecker. Run{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    pnpm run validate:woodpecker
                  </code>{" "}
                  after editing JSON files.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void handleResetAllAndLoadGenerated()}
                  className="border-amber-500/50 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                >
                  Reset & load Woodpecker bundles
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="hidden md:block rounded-md border border-border">
        <TrainingSetsTable
          rows={tableRows}
          onContinue={handleContinue}
          onStartCycle={handleStartCycle}
        />
      </div>

      <TrainingSetsMobileList
        overviews={displayedOverviews}
        onContinue={handleContinue}
        onStartCycle={handleStartCycle}
      />
      </div>
    </div>
  );
}
