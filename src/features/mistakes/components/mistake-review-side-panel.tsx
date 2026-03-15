"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MistakeStatusBadge } from "./mistake-status-badge";
import { cn } from "@/lib/utils";
import type { MistakeStatus } from "../types";
import { ROUTES } from "@/lib/constants";

export type ReviewInteractionState =
  | "idle"
  | "move-selected"
  | "checking"
  | "correct"
  | "incorrect";

export interface MistakeReviewSidePanelProps {
  trainingSetName: string;
  status: MistakeStatus;
  failedAttempts: number;
  solvedReviewCount: number;
  sideToMove: "w" | "b";
  gameSource?: string;
  difficulty?: string;
  puzzleState: ReviewInteractionState;
  onSkip?: () => void;
  onNextMistake?: () => void;
  className?: string;
}

export function MistakeReviewSidePanel({
  trainingSetName,
  status,
  failedAttempts,
  solvedReviewCount,
  sideToMove,
  gameSource,
  difficulty,
  puzzleState,
  onSkip,
  onNextMistake,
  className,
}: MistakeReviewSidePanelProps) {
  const resolved = puzzleState === "correct" || puzzleState === "incorrect";
  const isChecking = puzzleState === "checking";

  return (
    <Card className={cn(className)}>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">{trainingSetName}</p>
          <MistakeStatusBadge status={status} />
        </div>

        <dl className="space-y-1 text-sm">
          <div>
            <dt className="text-muted-foreground">Failed attempts</dt>
            <dd className="font-medium">{failedAttempts}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Solved in review</dt>
            <dd className="font-medium">{solvedReviewCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Side to move</dt>
            <dd className="font-medium">{sideToMove === "w" ? "White" : "Black"}</dd>
          </div>
          {gameSource != null && gameSource !== "" && (
            <div>
              <dt className="text-muted-foreground">Source</dt>
              <dd className="font-medium">{gameSource}</dd>
            </div>
          )}
          {difficulty != null && difficulty !== "" && (
            <div>
              <dt className="text-muted-foreground">Difficulty</dt>
              <dd className="font-medium capitalize">{difficulty}</dd>
            </div>
          )}
        </dl>

        <div className="space-y-2 pt-2">
          {!resolved && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onSkip}
              disabled={isChecking}
            >
              Skip
            </Button>
          )}
          {resolved && (
            <>
              <Button variant="default" className="w-full" onClick={onNextMistake}>
                Next Mistake
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={ROUTES.mistakes}>Back to Mistakes</Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
