"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getActiveTrainingState } from "../services/training-loader.service";
import { getOrCreateActiveSession } from "@/services/training-session.service";
import type { ActiveTrainingState } from "../types";

export type ReloadTrainingOptions = {
  /**
   * When true, skip the global loading flag so the training UI (e.g. board) stays mounted.
   * Use after advancing to the next exercise so Dexie refresh does not flash a full-page loader.
   */
  silent?: boolean;
};

export interface UseActiveTrainingResult {
  state: ActiveTrainingState | null;
  loading: boolean;
  error: Error | null;
  reload: (opts?: ReloadTrainingOptions) => Promise<void>;
}

/**
 * Loads active training state from Dexie (client-side).
 * Session is created/reused only when state is ready (interaction layer), not during load.
 *
 * The loader never returns sessionId. We keep `{ cycleRunId, sessionId }` in a ref so
 * each `reload()` / `reload({ silent: true })` reuses the same session for that cycle instead of calling getOrCreate
 * again (which could race and create duplicate empty sessions).
 */
export function useActiveTraining(): UseActiveTrainingResult {
  const [state, setState] = useState<ActiveTrainingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const sessionBindingRef = useRef<{
    cycleRunId: string;
    sessionId: string;
  } | null>(null);

  const load = useCallback(async (opts?: ReloadTrainingOptions) => {
    const silent = opts?.silent === true;
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await getActiveTrainingState();
      if (result.status === "ready") {
        const binding = sessionBindingRef.current;
        let sessionId: string;
        if (
          binding != null &&
          binding.cycleRunId === result.cycleRun.id
        ) {
          sessionId = binding.sessionId;
        } else {
          const session = await getOrCreateActiveSession(
            result.trainingSet.id,
            result.cycleRun.id
          );
          sessionId = session.id;
        }
        sessionBindingRef.current = {
          cycleRunId: result.cycleRun.id,
          sessionId,
        };
        setState({ ...result, sessionId });
      } else {
        sessionBindingRef.current = null;
        setState(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      sessionBindingRef.current = null;
      setState(null);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, loading, error, reload: load };
}
