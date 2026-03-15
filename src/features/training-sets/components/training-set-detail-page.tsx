"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { continueTraining, startNextCycle } from "../services/training-sets.service";
import { useTrainingSetDetail } from "../hooks/use-training-set-detail";
import { TrainingSetMetadataBadges } from "./training-set-metadata-badges";
import { TrainingSetSummaryCards } from "./training-set-summary-cards";
import { TrainingSetActiveCycleCard } from "./training-set-active-cycle-card";
import { TrainingSetCycleHistoryTable } from "./training-set-cycle-history-table";
import { TrainingSetCycleHistoryMobile } from "./training-set-cycle-history-mobile";

export interface TrainingSetDetailPageProps {
  trainingSetId: string;
}

export function TrainingSetDetailPage({ trainingSetId }: TrainingSetDetailPageProps) {
  const router = useRouter();
  const { data, loading, error, reload } = useTrainingSetDetail(trainingSetId);

  const handleContinue = React.useCallback(async () => {
    const result = await continueTraining(trainingSetId);
    if (result.success) router.push(result.route);
  }, [trainingSetId, router]);

  const handleStartCycle = React.useCallback(async () => {
    const result = await startNextCycle(trainingSetId);
    if (result.success) router.push(result.route);
  }, [trainingSetId, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        <PageHeader title="Training set" />
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[var(--muted-foreground)]">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        <PageHeader title="Training set" />
        <EmptyState
          title="Set not found"
          description="This training set may have been removed or the link is invalid."
        >
          <Button asChild>
            <Link href={ROUTES.sets}>Back to Training Sets</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  const { trainingSet, activeCycle, cycleHistory, actions } = data;

  if (trainingSet.exerciseCount === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        <PageHeader title={trainingSet.name} description={trainingSet.description} />
        <EmptyState
          title="No exercises"
          description="This set has no exercises yet. Add or import puzzles to start training."
        >
          <Button asChild variant="outline">
            <Link href={ROUTES.sets}>Back to Training Sets</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <PageHeader
        title={trainingSet.name}
        description={trainingSet.description}
      />
      <div className="mb-4">
        <TrainingSetMetadataBadges set={trainingSet} />
      </div>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">
          Summary
        </h2>
        <TrainingSetSummaryCards data={data} />
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">
          Actions
        </h2>
        <Button
          onClick={
            actions.canContinue
              ? handleContinue
              : actions.canStartNextCycle
                ? handleStartCycle
                : undefined
          }
          disabled={!actions.canContinue && !actions.canStartNextCycle}
        >
          {actions.primaryActionLabel}
        </Button>
      </section>

      {activeCycle && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">
            Active cycle
          </h2>
          <TrainingSetActiveCycleCard
            cycle={activeCycle}
            onContinue={handleContinue}
          />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">
          Cycle history
        </h2>
        {cycleHistory.length === 0 ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/10 p-6 text-center">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              No cycles started yet.
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Start your first cycle to see history here.
            </p>
            <Button className="mt-3" onClick={handleStartCycle}>
              Start Cycle 1
            </Button>
          </div>
        ) : (
          <>
            <div className="hidden md:block rounded-md border border-[var(--border)]">
              <TrainingSetCycleHistoryTable rows={cycleHistory} />
            </div>
            <TrainingSetCycleHistoryMobile rows={cycleHistory} />
          </>
        )}
      </section>
    </div>
  );
}
