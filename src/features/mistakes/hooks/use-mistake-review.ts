"use client";

import { useState, useEffect, useCallback } from "react";
import { getMistakeReviewState } from "../services/mistake-review-flow.service";
import type { MistakeReviewState } from "../types";

export interface UseMistakeReviewResult {
  state: MistakeReviewState | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

export function useMistakeReview(mistakeId: string | null): UseMistakeReviewResult {
  const [state, setState] = useState<MistakeReviewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!mistakeId) {
      setState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getMistakeReviewState(mistakeId);
      setState(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [mistakeId]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, loading, error, reload: load };
}
