import { PageHeader } from "@/components/shared/PageHeader";
import { PlaceholderCard } from "@/components/shared/PlaceholderCard";

export function AnalyticsShell() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Charts and insights from your training."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <PlaceholderCard
          title="Accuracy over time"
          description="Chart placeholder."
        />
        <PlaceholderCard
          title="Cycle compression"
          description="Chart placeholder."
        />
      </div>
    </>
  );
}
