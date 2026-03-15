import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="font-semibold text-[var(--foreground)]">
            {APP_NAME}
          </span>
          <nav className="flex gap-4">
            <Link
              href="/privacy"
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Terms
            </Link>
            <Button asChild>
              <Link href="/app">Open app</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-12">{children}</main>
    </div>
  );
}
