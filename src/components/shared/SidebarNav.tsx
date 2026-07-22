"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { TrackedSupportLink } from "@/components/shared/TrackedSupportLink";
import { cn } from "@/lib/utils";
import { DOCUMENTATION_URL, ROUTES } from "@/lib/constants";
import { countActive } from "@/repositories/mistake-entry.repository";
import {
  Dumbbell,
  Library,
  Target,
  TrendingUp,
  Settings,
  BookOpen,
  Heart,
} from "lucide-react";

const navItems = [
  { href: ROUTES.training, label: "Training", icon: Dumbbell },
  { href: ROUTES.sets, label: "Training Sets", icon: Library },
  { href: ROUTES.mistakes, label: "Mistakes", icon: Target },
  { href: ROUTES.progress, label: "Progress", icon: TrendingUp },
  { href: ROUTES.settings, label: "Settings", icon: Settings },
] as const;

/**
 * Live count of mistakes still in the review ladder (non-mastered), matching
 * the "Mistakes Remaining" stat on /app/mistakes. Undefined during SSR and
 * the first client render, so no badge is rendered until Dexie resolves —
 * markup stays identical across server and client.
 */
function usePendingMistakeCount(): number | undefined {
  return useLiveQuery(() => countActive(), []);
}

function MistakeCountBadge({
  count,
  collapsed,
}: {
  count: number | undefined;
  collapsed: boolean;
}) {
  if (!count) return null;
  const display = count > 99 ? "99+" : String(count);
  return (
    <span
      aria-label={`${count} mistakes to review`}
      className={cn(
        "pointer-events-none flex items-center justify-center rounded-full bg-amber-500/15 text-[10px] font-semibold leading-none text-amber-600 dark:text-amber-400",
        collapsed
          ? "absolute right-0.5 top-0.5 h-4 min-w-4 px-1"
          : "ml-auto h-5 min-w-5 shrink-0 px-1.5"
      )}
    >
      {display}
    </span>
  );
}

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
  const pathname = usePathname();
  const path = pathname ?? "";
  const isSupportActive =
    path === ROUTES.support || path.startsWith(`${ROUTES.support}/`);

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
        className={cn(
          secondaryLinkClass(collapsed),
          isSupportActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
        )}
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
  const pendingMistakes = usePendingMistakeCount();

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
              "relative flex h-10 w-full min-w-0 shrink-0 items-center rounded-md text-sm font-medium transition-colors",
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
            {href === ROUTES.mistakes ? (
              <MistakeCountBadge count={pendingMistakes} collapsed={collapsed} />
            ) : null}
          </Link>
        );
      })}
      <SidebarSecondaryLinks collapsed={collapsed} />
    </nav>
  );
}
