import type { Metadata } from "next";
import type { AppColorScheme } from "@/lib/chess/board-styles";
import { PreviewTraining } from "@/features/training/components/preview-training";

export const metadata: Metadata = {
  title: "Preview — Training",
  robots: { index: false, follow: false },
};

export default async function PreviewTrainingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp.pfPreview;
  const v = Array.isArray(raw) ? raw[0] : raw;
  const previewColorScheme: AppColorScheme = v === "light" ? "light" : "dark";

  return <PreviewTraining previewColorScheme={previewColorScheme} />;
}
