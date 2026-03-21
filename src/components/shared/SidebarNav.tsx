"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import {
  Dumbbell,
  Library,
  AlertCircle,
  BarChart3,
  Settings,
  BookOpen,
} from "lucide-react";

const navItems = [
  { href: ROUTES.training, label: "Training", icon: Dumbbell },
  { href: ROUTES.sets, label: "Training Sets", icon: Library },
  { href: ROUTES.mistakes, label: "Mistakes", icon: AlertCircle },
  { href: ROUTES.analytics, label: "Analytics", icon: BarChart3 },
  { href: ROUTES.settings, label: "Settings", icon: Settings },
] as const;

export function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-col gap-1 px-2 py-4"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        /** `/app/training` must not match `/app/training-2` via naive prefix (substring). */
        const isActive =
          href === ROUTES.training
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
              collapsed ? "justify-center px-2" : "px-3",
              collapsed ? "gap-0" : "gap-3",
              isActive
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            )}
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span
              className={cn(
                "transition-all duration-200",
                collapsed
                  ? "pointer-events-none max-w-0 overflow-hidden opacity-0"
                  : "max-w-full opacity-100"
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
      {!collapsed && (
        <div className="mt-auto border-t border-[var(--border)] pt-4">
          <Link
            href={ROUTES.docs}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            title="Documentation"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>Docs</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
