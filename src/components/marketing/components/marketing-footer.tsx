import Link from "next/link";
import AppTitle from "@/components/logo/AppTitle";
import Logo from "@/components/logo/Logo";
import { DOCUMENTATION_URL, ROUTES } from "@/lib/constants";
import {
  footerHeading,
  footerLinkClass,
  footerMuted,
  footerWordmarkClass,
} from "@/components/marketing/layout-classes";

export function MarketingFooter() {
  return (
    <footer className="w-full border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-3.5 py-12 sm:px-5 md:px-6 md:py-12">
        <div className="flex flex-col gap-12 text-left md:grid md:grid-cols-4 md:gap-8 md:text-left">
          <div className="space-y-5">
            <Link
              href={ROUTES.home}
              className="inline-flex max-w-full items-center gap-2.5 transition-opacity hover:opacity-85 sm:gap-3"
            >
              <span className="shrink-0 md:hidden">
                <Logo size={40} />
              </span>
              <span className="hidden shrink-0 md:inline">
                <Logo size={44} />
              </span>
              <AppTitle className={footerWordmarkClass} />
            </Link>
            <p className={`max-w-md md:max-w-xs ${footerMuted}`}>
              Structured chess training inspired by deliberate repetition.
            </p>
          </div>
          <div>
            <h3 className={footerHeading}>Product</h3>
            <ul className="mt-4 space-y-3 md:mt-5 md:space-y-3.5">
              <li>
                <Link href={ROUTES.app} className={`${footerLinkClass} block py-0.5`}>
                  Start training
                </Link>
              </li>
              <li>
                <Link href={ROUTES.sets} className={`${footerLinkClass} block py-0.5`}>
                  Training sets
                </Link>
              </li>
              <li>
                <Link href="/#method" className={`${footerLinkClass} block py-0.5`}>
                  Method
                </Link>
              </li>
              <li>
                <Link href="/#philosophy" className={`${footerLinkClass} block py-0.5`}>
                  Philosophy
                </Link>
              </li>
              {DOCUMENTATION_URL ? (
                <li>
                  <a
                    href={DOCUMENTATION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${footerLinkClass} block py-0.5`}
                  >
                    Documentation
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
          <div>
            <h3 className={footerHeading}>Legal</h3>
            <ul className="mt-4 space-y-3 md:mt-5 md:space-y-3.5">
              <li>
                <Link href={ROUTES.privacy} className={`${footerLinkClass} block py-0.5`}>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href={ROUTES.terms} className={`${footerLinkClass} block py-0.5`}>
                  Terms
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className={footerHeading}>About</h3>
            <p className={`mt-4 md:mt-5 ${footerMuted}`}>
              Rooted in Axel Smith and Hans Tikkanen&apos;s Woodpecker Method: fixed sets, iterative passes,
              deliberate practice—not endless random puzzles.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-3.5 py-6 text-sm text-neutral-500 sm:px-5 md:flex-row md:items-center md:justify-between md:px-6 dark:text-neutral-400">
          <p>© 2026 PatternForge</p>
          <p className="max-w-md leading-relaxed md:max-w-none md:text-right">
            Long-horizon pattern retention through cycle-based repetition.
          </p>
        </div>
      </div>
    </footer>
  );
}
