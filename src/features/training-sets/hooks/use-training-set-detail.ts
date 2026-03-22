"use client";

import * as React from "react";
import { getTrainingSetDetail } from "../services/training-set-detail.service";
import type { TrainingSetDetailViewModel } from "../types";

export interface UseTrainingSetDetailResult {
  data: TrainingSetDetailViewModel | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Loads training set detail view model for the detail page.
 */
export function useTrainingSetDetail(
  trainingSetId: string | null
): UseTrainingSetDetailResult {
  const [data, setData] = React.useState<TrainingSetDetailViewModel | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const load = React.useCallback(async () => {
    if (!trainingSetId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getTrainingSetDetail(trainingSetId);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [trainingSetId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
