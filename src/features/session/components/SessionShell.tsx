import { PageHeader } from "@/components/shared/PageHeader";
import { PlaceholderCard } from "@/components/shared/PlaceholderCard";

export function SessionShell() {
  return (
    <>
      <PageHeader
        title="Session"
        description="Configure and start a new training session."
      />
      <div className="max-w-xl space-y-6">
        <PlaceholderCard
          title="Session configuration"
          description="Set count, set selection, time limits."
        />
      </div>
    </>
  );
}
