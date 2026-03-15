"use client";

import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

export interface TrainingEmptyStateProps {
  title: string;
  description: string;
}

const TRAINING_SETS_LINK = "/app/sets";

export function TrainingEmptyState({ title, description }: TrainingEmptyStateProps) {
  return (
    <EmptyState title={title} description={description}>
      <Button asChild variant="default">
        <Link href={TRAINING_SETS_LINK}>Go to Training Sets</Link>
      </Button>
    </EmptyState>
  );
}
