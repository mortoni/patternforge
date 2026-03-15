"use client";

import { useState, useEffect, useCallback } from "react";
import { getActiveMistakes, getMistakeSummary } from "../services/mistake-review-flow.service";
import type { MistakeListRow, MistakeSummary } from "../types";

export interface UseMistakesListResult {
  rows: MistakeListRow[];
  summary: MistakeSummary | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

export function useMistakesList(): UseMistakesListResult {
  const [rows, setRows] = useState<MistakeListRow[]>([]);
  const [summary, setSummary] = useState<MistakeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, counts] = await Promise.all([
        getActiveMistakes(),
        getMistakeSummary(),
      ]);
      setRows(list);
      setSummary(counts);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, summary, loading, error, reload: load };
}
