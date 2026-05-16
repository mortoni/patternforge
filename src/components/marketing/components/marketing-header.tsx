import Link from "next/link";
import AppTitle from "@/components/logo/AppTitle";
import Logo from "@/components/logo/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { DOCUMENTATION_URL, ROUTES } from "@/lib/constants";
import {
  containerClass,
  headerWordmarkClass,
  navLinkClass,
} from "@/components/marketing/layout-classes";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-border/55 bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/80 dark:border-white/8">
      <div
        className={`${containerClass} flex items-center justify-between gap-2 py-3 md:gap-6 md:py-3.5`}
      >
        <Link
          href={ROUTES.home}
          className="flex min-w-0 items-center gap-2 sm:gap-2.5 md:gap-3"
        >
          <span className="shrink-0 md:hidden">
            <Logo size={36} />
          </span>
          <span className="hidden shrink-0 md:inline">
            <Logo size={40} />
          </span>
          <AppTitle className={headerWordmarkClass} />
        </Link>
        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          <nav
            className="hidden flex-wrap items-center justify-end gap-x-5 gap-y-2 md:flex"
            aria-label="Marketing"
          >
            <Link href="#philosophy" className={navLinkClass}>
              Philosophy
            </Link>
            <Link href="#method" className={navLinkClass}>
              Method
            </Link>
            {DOCUMENTATION_URL ? (
              <a
                href={DOCUMENTATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={navLinkClass}
              >
                Documentation
              </a>
            ) : null}
            <Link href={ROUTES.sets} className={navLinkClass}>
              Training Sets
            </Link>
            <Link href={ROUTES.privacy} className={navLinkClass}>
              Privacy
            </Link>
            <Link href={ROUTES.terms} className={navLinkClass}>
              Terms
            </Link>
          </nav>
          <ThemeToggle />
          <Button
            asChild
            size="sm"
            className="h-10 min-w-22 shrink-0 px-4 transition-[opacity,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-95 hover:-translate-y-px hover:shadow-[0_8px_24px_-10px_color-mix(in_oklab,var(--primary)_38%,transparent)] active:translate-y-0 motion-reduce:transform-none motion-reduce:hover:shadow-none"
          >
            <Link href={ROUTES.app}>Start training</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
