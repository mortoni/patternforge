"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SidebarNav } from "@/components/shared/SidebarNav";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { runMigrations } from "@/db/migrations";

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    runMigrations().catch(() => {});
  }, []);
  return (
    <div className={cn("flex min-h-screen bg-[var(--background)]", className)}>
      <aside className="hidden w-56 shrink-0 border-r border-[var(--border)] md:block">
        <div className="sticky top-0 flex h-16 items-center border-b border-[var(--border)] px-4">
          <Link
            href="/app"
            className="font-semibold text-[var(--foreground)]"
          >
            {APP_NAME}
          </Link>
        </div>
        <SidebarNav />
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b border-[var(--border)] bg-[var(--background)]/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60 md:hidden">
          <Link href="/app" className="font-semibold text-[var(--foreground)]">
            {APP_NAME}
          </Link>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
