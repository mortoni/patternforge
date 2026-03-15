"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Training preferences section. Scaffold for future options (e.g. auto-advance, show source).
 * Only low-risk, already-used preferences are added in Phase 7.
 */
export function TrainingPreferencesCard() {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium text-foreground">
          Training preferences
        </h3>
        <p className="text-xs text-muted-foreground">
          Options that affect the training and review experience. More options
          may be added in future phases.
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          No additional preferences in this phase. Board orientation above
          applies to training and mistake review.
        </p>
      </CardContent>
    </Card>
  );
}
