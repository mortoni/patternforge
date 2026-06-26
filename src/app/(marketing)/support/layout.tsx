import { AppShell } from "@/components/shared/AppShell";

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
