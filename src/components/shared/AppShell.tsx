"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/shared/SidebarNav";
import AppTitle from "@/components/logo/AppTitle";
import Logo from "@/components/logo/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { runMigrations } from "@/db/migrations";
import { SidebarProvider, useSidebar } from "@/components/shared/sidebar/sidebar-context";

/**
 * `react-remove-scroll-bar` injects styles for this class when Radix Select (etc.) lock
 * scroll: full-bleed roots get `margin-right: var(scrollbar gap)` so layout does not
 * shrink. Same string as `RemoveScroll.classNames.fullWidth` from `react-remove-scroll`.
 * @see https://github.com/radix-ui/primitives/discussions/1586
 */
const REMOVE_SCROLL_FULL_WIDTH_CLASS = "width-before-scroll-bar";

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

  /** Full app navigation on small screens (persistent sidebar is `md:flex` only). */
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const isTrainingFocus =
    pathname != null &&
    pathname !== ROUTES.trainingSessionSummary &&
    (pathname === ROUTES.training || pathname.startsWith(`${ROUTES.training}/`));

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
        } else if (window.matchMedia("(max-width: 767.98px)").matches) {
          setMobileNavOpen((open) => !open);
        } else {
          toggleCollapsed();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, overlayOpen, closeOverlay, openOverlay, toggleCollapsed]);

  const sidebarCollapsed = overlayMode === "collapsed";

  const mobileDrawerOpen = mode === "hidden" ? overlayOpen : mobileNavOpen;

  const openMobileDrawer = React.useCallback(() => {
    if (mode === "hidden") openOverlay();
    else setMobileNavOpen(true);
  }, [mode, openOverlay]);

  const closeMobileDrawer = React.useCallback(() => {
    if (mode === "hidden") closeOverlay();
    else setMobileNavOpen(false);
  }, [mode, closeOverlay]);

  return (
    <div
      className={cn(
        "flex h-dvh min-h-0 w-full min-w-0 max-w-full overflow-hidden bg-[var(--background)]",
        REMOVE_SCROLL_FULL_WIDTH_CLASS,
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

      {mobileDrawerOpen && (
        <OverlaySidebar
          collapsed={mode === "hidden" ? sidebarCollapsed : false}
          overlayMode={mode === "hidden" ? overlayMode : "expanded"}
          onClose={closeMobileDrawer}
          onToggle={mode === "hidden" ? toggleCollapsed : undefined}
          showCollapseToggle={mode === "hidden"}
        />
      )}

      {/* Training focus: menu lives in the mobile top bar; floating control only on md+. */}
      {mode === "hidden" && !overlayOpen && (
        <button
          type="button"
          onClick={openOverlay}
          aria-label="Open navigation menu"
          className="pointer-events-none fixed left-6 top-6 z-50 hidden h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--background)]/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] md:pointer-events-auto md:inline-flex"
        >
          <Menu className="h-5 w-5 pointer-events-none" aria-hidden />
        </button>
      )}

      <div className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden transition-all duration-200">
        <header className="sticky top-0 z-40 shrink-0 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60 md:hidden">
          <div className="grid h-14 grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 px-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center justify-self-start">
              <button
                type="button"
                onClick={openMobileDrawer}
                aria-label="Open navigation menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <Menu className="h-5 w-5 pointer-events-none" aria-hidden />
              </button>
            </div>
            <Link
              href={ROUTES.home}
              aria-label="PatternForge — back to home"
              className="flex min-w-0 max-w-full items-center justify-center gap-1.5 justify-self-center text-[var(--foreground)] no-underline transition-opacity hover:opacity-85"
            >
              <Logo size={24} className="shrink-0" />
              <AppTitle className="min-w-0 truncate whitespace-nowrap text-xs tracking-[0.2em] sm:text-sm sm:tracking-[0.28em]" />
            </Link>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center justify-self-end">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="min-h-0 w-full min-w-0 max-w-full flex-1 overflow-y-auto p-4 md:p-6 transition-all duration-200">
          {children}
        </main>
      </div>
      {!isTrainingFocus && (
        <ThemeToggle className="fixed right-6 top-5 z-50 hidden border border-[var(--border)] bg-[var(--background)]/90 backdrop-blur transition-colors hover:bg-[var(--muted)] md:inline-flex" />
      )}
    </div>
  );
}

function OverlaySidebar({
  collapsed,
  overlayMode,
  onClose,
  onToggle,
  showCollapseToggle = true,
}: {
  collapsed: boolean;
  overlayMode: "expanded" | "collapsed";
  onClose: () => void;
  onToggle?: () => void;
  showCollapseToggle?: boolean;
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
            showCollapseToggle
              ? collapsed
                ? "justify-center px-3"
                : "justify-between gap-2 pl-5 pr-2"
              : "justify-between gap-2 px-3"
          )}
        >
          {showCollapseToggle ? (
            <>
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
                onClick={() => onToggle?.()}
                aria-label={
                  overlayMode === "expanded"
                    ? "Collapse sidebar"
                    : "Expand sidebar"
                }
                className="inline-flex shrink-0 items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                {overlayMode === "expanded" ? (
                  <ChevronLeft
                    className="h-4 w-4 pointer-events-none"
                    aria-hidden
                  />
                ) : (
                  <ChevronRight
                    className="h-4 w-4 pointer-events-none"
                    aria-hidden
                  />
                )}
              </button>
            </>
          ) : (
            <>
              <Link
                href={ROUTES.home}
                aria-label="PatternForge — back to home"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 overflow-hidden text-[var(--foreground)] no-underline transition-opacity hover:opacity-85"
              >
                <Logo size={28} className="shrink-0" />
                <AppTitle className="block min-w-0 max-w-full truncate text-xs" />
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="inline-flex shrink-0 items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4 pointer-events-none" aria-hidden />
              </button>
            </>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav collapsed={collapsed} />
        </div>
      </aside>
    </div>
  );
}
