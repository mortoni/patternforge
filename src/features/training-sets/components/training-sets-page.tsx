"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrainingSetsTable } from "./training-sets-table";
import { TrainingSetsMobileList } from "./training-sets-mobile-list";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ensureSeededForDevelopment,
  getTrainingSetsOverview,
  continueTraining,
  startNextCycle,
} from "../services/training-sets.service";
import { mapOverviewToTableRow, dedupeTableRows } from "../lib/map-training-set-row";
import type { TrainingSetOverview } from "../types";

export function TrainingSetsPage() {
  const router = useRouter();
  const [overviews, setOverviews] = React.useState<TrainingSetOverview[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = React.useState<string>("all");

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        await ensureSeededForDevelopment();
        if (cancelled) return;
        const list = await getTrainingSetsOverview();
        if (cancelled) return;
        setOverviews(list);
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
  }, []);

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
            <SelectItem value="Woodpecker">Woodpecker</SelectItem>
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
