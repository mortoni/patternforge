import { Suspense } from "react";
import { SessionSummaryView } from "@/features/session-summary/components/session-summary-view";

function SessionSummaryFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

export default function TrainingSessionSummaryPage() {
  return (
    <Suspense fallback={<SessionSummaryFallback />}>
      <SessionSummaryView />
    </Suspense>
  );
}
