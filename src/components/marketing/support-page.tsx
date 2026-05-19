import Link from "next/link";
import { CreditCard } from "lucide-react";
import { DonationPageTelemetry } from "@/components/shared/DonationPageTelemetry";
import { MarketingSubpageShell } from "@/components/marketing/components/marketing-subpage-shell";
import { SupportDonationOptions } from "@/components/marketing/components/support-donation-options";
import { SupportCryptoDonations } from "@/components/marketing/components/support-crypto-donations";
import {
  supportInlineLinkClass,
  supportPageArticleClass,
} from "@/components/marketing/support-layout-classes";
import { ROUTES } from "@/lib/constants";

const body = "text-[15px] leading-relaxed text-muted-foreground";
const sectionTitle = "text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground/75";

export default function SupportPage() {
  return (
    <MarketingSubpageShell>
      <DonationPageTelemetry variant="support_page" />
      <article
        className={supportPageArticleClass}
        data-testid="support-page-content"
      >
        <header className="pb-8 sm:pb-10">
          <p className={sectionTitle}>Support</p>
          <h1 className="mt-3 text-pretty text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            Support PatternForge
          </h1>
          <p className={`mt-6 max-w-2xl ${body}`}>
            PatternForge is free and independently maintained. Optional support
            helps keep training accessible for everyone.
          </p>
        </header>

        <section
          className="mt-12"
          aria-labelledby="creator-note-heading"
        >
          <h2 id="creator-note-heading" className={sectionTitle}>
            About this project
          </h2>
          <blockquote className="mt-4 border-l-2 border-border/80 pl-4 sm:pl-5">
            <p className={`max-w-2xl text-pretty ${body}`}>
              PatternForge started as a personal training project inspired by
              disciplined repetition and tactical pattern recognition. It is built
              and maintained independently with the goal of making focused chess
              training freely available.
            </p>
          </blockquote>
        </section>

        <section
          className="mt-14"
          aria-labelledby="support-options-heading"
        >
          <h2 id="support-options-heading" className={sectionTitle}>
            Ways to support
          </h2>
          <p className={`mt-4 max-w-2xl ${body}`}>
            PatternForge is free and independently maintained. Optional support
            helps keep training accessible for everyone.
          </p>

          <div className="mt-10" aria-labelledby="donate-card-heading">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/35 text-muted-foreground">
                <CreditCard className="h-4 w-4" aria-hidden />
              </span>
              <h3
                id="donate-card-heading"
                className="text-base font-medium tracking-tight text-foreground"
              >
                Donate with card
              </h3>
            </div>
            <p className={`mt-3 max-w-2xl ${body}`}>
              One-time card donations through Stripe. Choose an amount below—there
              is no obligation to contribute.
            </p>
            <div className="mt-6">
              <SupportDonationOptions />
            </div>
          </div>

          <SupportCryptoDonations />
        </section>

        <footer className="mt-14 pt-2 sm:mt-16">
          <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${body}`}>
            <Link href={ROUTES.home} className={supportInlineLinkClass}>
              Back to home
            </Link>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <Link href={ROUTES.app} className={supportInlineLinkClass}>
              Open app
            </Link>
          </p>
        </footer>
      </article>
    </MarketingSubpageShell>
  );
}
