import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default function DocsIndexPage() {
  redirect(`${ROUTES.docs}/introduction`);
}
