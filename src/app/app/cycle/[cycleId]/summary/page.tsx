import type { Metadata } from "next";
import { CycleSummaryPage } from "@/features/cycle-summary/components/cycle-summary-page";

export const metadata: Metadata = {
  title: "Cycle Summary",
};

interface PageProps {
  params: Promise<{ cycleId: string }>;
}

export default async function CycleSummaryRoute({ params }: PageProps) {
  const { cycleId } = await params;
  return <CycleSummaryPage cycleId={cycleId} />;
}
