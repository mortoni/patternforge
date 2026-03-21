import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default async function Training2SessionSummaryRedirect(props: {
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const sp = await props.searchParams;
  const q = new URLSearchParams();
  if (sp.sessionId) q.set("sessionId", sp.sessionId);
  const suffix = q.toString() ? `?${q}` : "";
  redirect(`${ROUTES.trainingSessionSummary}${suffix}`);
}
