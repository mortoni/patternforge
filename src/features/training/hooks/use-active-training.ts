"use client";

import { useState, useEffect, useCallback } from "react";
import { getActiveTrainingState } from "../services/training-loader.service";
import { getOrCreateActiveSession } from "@/services/training-session.service";
import type { ActiveTrainingState } from "../types";

export interface UseActiveTrainingResult {
  state: ActiveTrainingState | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

/**
 * Loads active training state from Dexie (client-side).
 * Session is created/reused only when state is ready (interaction layer), not during load.
 */
export function useActiveTraining(): UseActiveTrainingResult {
  const [state, setState] = useState<ActiveTrainingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getActiveTrainingState();
      setState(result);
      if (
        result.status === "ready" &&
        result.sessionId == null
      ) {
        const session = await getOrCreateActiveSession(
          result.trainingSet.id,
          result.cycleRun.id
        );
        setState((prev) =>
          prev && prev.status === "ready"
            ? { ...prev, sessionId: session.id }
            : prev
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { state, loading, error, reload: load };
}
