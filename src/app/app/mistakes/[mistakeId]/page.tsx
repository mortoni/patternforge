import { MistakeReviewPage } from "@/features/mistakes/components/mistake-review-page";

interface MistakeReviewRouteProps {
  params: Promise<{ mistakeId: string }>;
}

export default async function MistakeReviewRoute({ params }: MistakeReviewRouteProps) {
  const { mistakeId } = await params;
  return <MistakeReviewPage mistakeId={mistakeId} />;
}
