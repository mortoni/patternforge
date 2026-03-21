import Link from "next/link";
import AppTitle from "@/components/logo/AppTitle";
import Logo from "@/components/logo/Logo";
import { Button } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const containerClass =
  "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

const subpageAppTitleClass =
  "text-[11px] tracking-[0.22em] sm:text-xs sm:tracking-[0.28em] md:text-sm md:tracking-[0.35em]";

export function MarketingSubpageShell({
  children,
  /** When true, main is full width (e.g. docs with a left sidebar). */
  fullWidthMain = false,
  /** Use spaced PATTERN FORGE wordmark (e.g. docs) instead of “PatternForge”. */
  wordmark = "default",
}: {
  children: React.ReactNode;
  fullWidthMain?: boolean;
  wordmark?: "default" | "app-title";
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/80">
        <div
          className={`${containerClass} flex flex-wrap items-center justify-between gap-4 py-3.5`}
        >
          <Link
            href={ROUTES.home}
            className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-85"
          >
            <Logo size={36} />
            {wordmark === "app-title" ? (
              <AppTitle className={subpageAppTitleClass} />
            ) : (
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {APP_NAME}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={ROUTES.home}>Home</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={ROUTES.app}>Open app</Link>
            </Button>
          </div>
        </div>
      </header>
      <main
        className={cn(
          fullWidthMain
            ? "w-full min-h-[calc(100dvh-3.75rem)]"
            : "mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8"
        )}
      >
        {children}
      </main>
    </div>
  );
}
