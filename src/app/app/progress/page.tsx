import type { Metadata } from "next";
import { ProgressPage } from "@/features/analytics/components/progress-page";

export const metadata: Metadata = {
  title: "Progress",
};

export default function ProgressRoute() {
  return <ProgressPage />;
}
