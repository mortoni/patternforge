import { TrainingSetDetailPage } from "@/features/training-sets/components/training-set-detail-page";

interface PageProps {
  params: Promise<{ trainingSetId: string }>;
}

export default async function TrainingSetDetailRoute({ params }: PageProps) {
  const { trainingSetId } = await params;
  return <TrainingSetDetailPage trainingSetId={trainingSetId} />;
}
