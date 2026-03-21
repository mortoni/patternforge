import type { Metadata } from "next";
import { AppShell } from "@/components/shared/AppShell";

export const metadata: Metadata = {
  title: "Pattern Forge",
  description: "Chess tactics training",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
