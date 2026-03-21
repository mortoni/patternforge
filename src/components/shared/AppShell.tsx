"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { SidebarNav } from "@/components/shared/SidebarNav";
import AppTitle from "@/components/logo/AppTitle";
import Logo from "@/components/logo/Logo";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { runMigrations } from "@/db/migrations";
import { SidebarProvider, useSidebar } from "@/components/shared/sidebar/sidebar-context";

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SidebarProvider>
      <AppShellInner className={className}>{children}</AppShellInner>
    </SidebarProvider>
  );
}

function AppShellInner({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    runMigrations().catch(() => {});
  }, []);

  const pathname = usePathname();
  const {
    mode,
    overlayOpen,
    overlayMode,
    toggleCollapsed,
    enterHiddenMode,
    exitHiddenMode,
    openOverlay,
    closeOverlay,
  } = useSidebar();

  /** `/app/training-2` would falsely match `startsWith("/app/training")` in JS. */
  const isTrainingFocus = (() => {
    if (!pathname) return false;
    if (pathname === ROUTES.training || pathname.startsWith(`${ROUTES.training}/`))
      return true;
    if (pathname === "/app/training-2" || pathname.startsWith("/app/training-2/"))
      return true;
    return false;
  })();

  React.useEffect(() => {
    if (isTrainingFocus && mode !== "hidden") {
      enterHiddenMode();
      return;
    }
    if (!isTrainingFocus && mode === "hidden") {
      exitHiddenMode();
    }
  }, [isTrainingFocus, mode, enterHiddenMode, exitHiddenMode]);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === "b") {
        e.preventDefault();
        if (mode === "hidden") {
          if (overlayOpen) closeOverlay();
          else openOverlay();
        } else {
          toggleCollapsed();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, overlayOpen, closeOverlay, openOverlay, toggleCollapsed]);

  const sidebarCollapsed = overlayMode === "collapsed";

  return (
    <div
      className={cn(
        "flex h-dvh min-h-0 overflow-hidden bg-[var(--background)]",
        className
      )}
    >
      {mode !== "hidden" && (
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-r border-[var(--border)] transition-[width] duration-200 md:flex md:h-full md:min-h-0 md:overflow-hidden",
            mode === "expanded" ? "w-[240px]" : "w-[64px]"
          )}
        >
          <div
            className={cn(
              "flex h-16 shrink-0 items-center border-b border-[var(--border)] transition-all duration-200",
              mode === "expanded"
                ? "justify-between gap-2 pl-5 pr-2"
                : "justify-center px-3"
            )}
          >
            {mode === "expanded" && (
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 overflow-hidden">
                <Link
                  href={ROUTES.home}
                  aria-label="PatternForge — back to home"
                  className="flex min-w-0 cursor-pointer items-center gap-2 overflow-hidden text-[var(--foreground)] no-underline transition-opacity hover:opacity-85"
                >
                  <Logo size={28} className="shrink-0" />
                  <AppTitle className="block min-w-0 max-w-full truncate text-xs" />
                </Link>
              </div>
            )}
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={mode === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
              className="inline-flex shrink-0 items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            >
              {mode === "expanded" ? (
                <ChevronLeft className="h-4 w-4 pointer-events-none" aria-hidden />
              ) : (
                <ChevronRight className="h-4 w-4 pointer-events-none" aria-hidden />
              )}
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SidebarNav collapsed={mode === "collapsed"} />
          </div>
        </aside>
      )}

      {mode === "hidden" && overlayOpen && (
        <OverlaySidebar
          collapsed={sidebarCollapsed}
          overlayMode={overlayMode}
          onClose={closeOverlay}
          onToggle={toggleCollapsed}
        />
      )}

      {mode === "hidden" && !overlayOpen && (
        <button
          type="button"
          onClick={openOverlay}
          aria-label="Open sidebar"
          className="fixed left-4 top-4 z-50 rounded-md border border-[var(--border)] bg-[var(--background)]/90 p-2 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-[var(--foreground)] hover:bg-[var(--muted)] md:left-6 md:top-6"
        >
          <Menu className="h-5 w-5 pointer-events-none" aria-hidden />
        </button>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden transition-all duration-200">
        <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60 md:hidden">
          <Link
            href={ROUTES.home}
            aria-label="PatternForge — back to home"
            className="flex min-w-0 cursor-pointer items-center gap-2 text-[var(--foreground)] no-underline transition-opacity hover:opacity-85"
          >
            <Logo size={28} className="shrink-0" />
            <AppTitle className="min-w-0 truncate" />
          </Link>
          <Link
            href={ROUTES.docs}
            className="text-xs text-muted-foreground no-underline transition-colors hover:text-foreground"
            title="Documentation"
          >
            Docs
          </Link>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 transition-all duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}

function OverlaySidebar({
  collapsed,
  overlayMode,
  onClose,
  onToggle,
}: {
  collapsed: boolean;
  overlayMode: "expanded" | "collapsed";
  onClose: () => void;
  onToggle: () => void;
}) {
  const [entered, setEntered] = React.useState(false);

  React.useEffect(() => {
    setEntered(true);
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-200",
          entered ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "absolute left-0 top-0 flex h-full min-h-0 flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--background)] transition-[width,transform] duration-200",
          overlayMode === "expanded" ? "w-[240px]" : "w-[64px]",
          entered ? "translate-x-0" : "-translate-x-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-[var(--border)] transition-all duration-200",
            collapsed ? "justify-center px-3" : "justify-between gap-2 pl-5 pr-2"
          )}
        >
          {!collapsed && (
            <Link
              href={ROUTES.home}
              aria-label="PatternForge — back to home"
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 overflow-hidden text-[var(--foreground)] no-underline transition-opacity hover:opacity-85"
            >
              <Logo size={28} className="shrink-0" />
              <AppTitle className="block min-w-0 max-w-full truncate text-xs" />
            </Link>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-label={
              overlayMode === "expanded" ? "Collapse sidebar" : "Expand sidebar"
            }
            className="inline-flex shrink-0 items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            {overlayMode === "expanded" ? (
              <ChevronLeft className="h-4 w-4 pointer-events-none" aria-hidden />
            ) : (
              <ChevronRight className="h-4 w-4 pointer-events-none" aria-hidden />
            )}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav collapsed={collapsed} />
        </div>
      </aside>
    </div>
  );
}
