import { PageHeader } from "@/components/shared/PageHeader";
import { PlaceholderCard } from "@/components/shared/PlaceholderCard";
import { EmptyState } from "@/components/shared/EmptyState";

export function SetsShell() {
  return (
    <>
      <PageHeader
        title="Training Sets"
        description="Manage your tactic sets and exercises."
      />
      <div className="space-y-6">
        <PlaceholderCard
          title="Training set cards"
          description="Cards for each set with progress and actions."
        />
        <EmptyState
          title="No sets yet"
          description="Create or import a training set to get started."
        />
      </div>
    </>
  );
}
