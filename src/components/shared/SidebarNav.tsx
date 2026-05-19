"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrackedSupportLink } from "@/components/shared/TrackedSupportLink";
import { cn } from "@/lib/utils";
import { DOCUMENTATION_URL, ROUTES } from "@/lib/constants";
import {
  Dumbbell,
  Library,
  TrendingUp,
  Settings,
  BookOpen,
  Heart,
} from "lucide-react";

const navItems = [
  { href: ROUTES.training, label: "Training", icon: Dumbbell },
  { href: ROUTES.sets, label: "Training Sets", icon: Library },
  { href: ROUTES.progress, label: "Progress", icon: TrendingUp },
  { href: ROUTES.settings, label: "Settings", icon: Settings },
] as const;

const showDocumentationLink = Boolean(DOCUMENTATION_URL);

const secondaryLinkClass = (collapsed: boolean) =>
  cn(
    "flex h-10 w-full min-w-0 shrink-0 items-center rounded-md text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
    collapsed ? "justify-center px-2" : "gap-3 px-3"
  );

const secondaryLinkLabelClass = (collapsed: boolean) =>
  cn(
    "min-w-0 transition-all duration-200",
    collapsed
      ? "pointer-events-none max-w-0 overflow-hidden opacity-0"
      : "truncate opacity-100"
  );

function SidebarSecondaryLinks({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "mt-auto flex flex-col gap-1 border-t border-border pt-4",
        collapsed && "items-center px-0"
      )}
    >
      <TrackedSupportLink
        href={ROUTES.support}
        source="sidebar"
        className={secondaryLinkClass(collapsed)}
        title="Support PatternForge"
        aria-label={collapsed ? "Support PatternForge" : undefined}
      >
        <Heart className="h-4 w-4 shrink-0" aria-hidden />
        <span className={secondaryLinkLabelClass(collapsed)}>
          Support PatternForge
        </span>
      </TrackedSupportLink>
      {showDocumentationLink ? (
        <a
          href={DOCUMENTATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={secondaryLinkClass(collapsed)}
          title="Documentation (Storybook)"
          aria-label={
            collapsed
              ? "Open documentation in Storybook (new tab)"
              : undefined
          }
        >
          <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
          <span className={secondaryLinkLabelClass(collapsed)}>
            Documentation
          </span>
        </a>
      ) : null}
    </div>
  );
}

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
      <SidebarSecondaryLinks collapsed={collapsed} />
    </nav>
  );
}
