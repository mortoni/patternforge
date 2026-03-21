"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cycleSummaryRoute } from "@/lib/constants";
import type { ActiveTrainingState } from "../types";

/**
 * When the loader reports `cycle-complete` (e.g. active run index past exercises),
 * send the user to that cycle's summary. In-session completion still uses direct
 * `router.replace` from move handlers.
 */
export function useCycleCompleteRedirect(
  state: ActiveTrainingState | null | undefined
): void {
  const router = useRouter();
  React.useEffect(() => {
    if (state?.status !== "cycle-complete") return;
    router.replace(cycleSummaryRoute(state.cycleRunId));
  }, [state, router]);
}
