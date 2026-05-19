/**
 * Post-donation thank-you page after Stripe Payment Link checkout.
 *
 * Payment completion is handled by Stripe-hosted checkout. PatternForge does not
 * verify Checkout Sessions server-side (no backend, secret keys, or webhooks).
 * Stripe may append query params (e.g. `session_id`); they are ignored here—this
 * page is only a calm return destination configured as the Payment Link success URL.
 */
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { DonationPageTelemetry } from "@/components/shared/DonationPageTelemetry";
import { MarketingSubpageShell } from "@/components/marketing/components/marketing-subpage-shell";
import {
  supportInlineLinkClass,
  supportPageArticleClass,
  supportSuccessActionsClass,
  supportTouchTargetClass,
} from "@/components/marketing/support-layout-classes";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const body = "text-[15px] leading-relaxed text-muted-foreground";
const sectionTitle =
  "text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground/75";

export default function SupportSuccessPage() {
  return (
    <MarketingSubpageShell>
      <DonationPageTelemetry variant="stripe_success" />
      <article
        className={supportPageArticleClass}
        data-testid="support-success-content"
      >
        <header className="pb-8 sm:pb-10">
          <p className={sectionTitle}>Support</p>
          <div className="relative mt-5 inline-flex">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -m-3 rounded-full bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] blur-2xl"
            />
            <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-muted/25 text-muted-foreground">
              <CircleCheck className="h-5 w-5" aria-hidden strokeWidth={1.75} />
            </span>
          </div>
          <h1 className="mt-5 text-pretty text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            Thank you for supporting PatternForge.
          </h1>
          <p className={`mt-6 max-w-2xl ${body}`}>
            Your support helps keep training free and independently maintained.
          </p>
          <p className={`mt-4 max-w-2xl ${body}`}>
            You can now return to your training whenever you are ready.
          </p>
        </header>

        <nav
          className={supportSuccessActionsClass}
          aria-label="After donation"
        >
          <Button
            asChild
            size="lg"
            className={cn("w-full sm:w-auto", supportTouchTargetClass)}
          >
            <Link href={ROUTES.training}>Return to training</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className={cn("w-full sm:w-auto", supportTouchTargetClass)}
          >
            <Link href={ROUTES.support}>Back to support</Link>
          </Button>
        </nav>

        <footer className="mt-14 pt-2 sm:mt-16">
          <p className={`text-sm ${body}`}>
            <Link href={ROUTES.home} className={supportInlineLinkClass}>
              Back to home
            </Link>
          </p>
        </footer>
      </article>
    </MarketingSubpageShell>
  );
}
