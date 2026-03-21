import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default function Training2Redirect() {
  redirect(ROUTES.training);
}
