"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DOCUMENTATION_URL, ROUTES } from "@/lib/constants";
import { Dumbbell, Library, TrendingUp, Settings, BookOpen } from "lucide-react";

const navItems = [
  { href: ROUTES.training, label: "Training", icon: Dumbbell },
  { href: ROUTES.sets, label: "Training Sets", icon: Library },
  { href: ROUTES.progress, label: "Progress", icon: TrendingUp },
  { href: ROUTES.settings, label: "Settings", icon: Settings },
] as const;

const showDocumentationLink = Boolean(DOCUMENTATION_URL);

export function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const path = pathname ?? "";

  return (
    <nav
      className="flex flex-col gap-1 px-2 py-4"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === ROUTES.training
            ? path === href || path.startsWith(`${href}/`)
            : href === ROUTES.progress
              ? path === href ||
                path.startsWith(`${href}/`) ||
                path.startsWith("/app/cycle/")
              : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex h-10 w-full min-w-0 shrink-0 items-center rounded-md text-sm font-medium transition-colors",
              collapsed ? "justify-center px-2" : "gap-3 px-3",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span
              className={cn(
                "min-w-0 transition-all duration-200",
                collapsed
                  ? "pointer-events-none max-w-0 overflow-hidden opacity-0"
                  : "truncate opacity-100"
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
      {showDocumentationLink ? (
        <div
          className={cn(
            "mt-auto border-t border-border pt-4",
            collapsed && "flex justify-center px-0"
          )}
        >
          <a
            href={DOCUMENTATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex h-10 w-full min-w-0 shrink-0 items-center rounded-md text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed ? "justify-center px-2" : "gap-3 px-3"
            )}
            title="Documentation (Storybook)"
            aria-label={
              collapsed
                ? "Open documentation in Storybook (new tab)"
                : undefined
            }
          >
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
            <span
              className={cn(
                "min-w-0 transition-all duration-200",
                collapsed
                  ? "pointer-events-none max-w-0 overflow-hidden opacity-0"
                  : "truncate opacity-100"
              )}
            >
              Documentation
            </span>
          </a>
        </div>
      ) : (
        <div className="mt-auto" aria-hidden />
      )}
    </nav>
  );
}
