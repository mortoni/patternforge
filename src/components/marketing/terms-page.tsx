import Link from "next/link";
import { MarketingSubpageShell } from "@/components/marketing/components/marketing-subpage-shell";
import { ROUTES } from "@/lib/constants";

const LEGAL_EMAIL = "legal@patternforge.app";

const sectionTitle = "text-lg font-semibold tracking-tight text-foreground";
const body = "text-[15px] leading-relaxed text-muted-foreground";
const list = "ml-5 list-disc space-y-2 text-[15px] leading-relaxed text-muted-foreground";

export default function TermsPage() {
  return (
    <MarketingSubpageShell>
      <article className="pb-16">
        <header className="border-b border-border pb-10">
          <h1 className="text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            Terms of Service
          </h1>
          <p className={`mt-4 text-sm ${body}`}>
            <span className="font-medium text-foreground">Effective date:</span>{" "}
            March 21, 2026
          </p>
          <p className={`mt-6 max-w-2xl ${body}`}>
            Welcome to PatternForge. These Terms of Service (&quot;Terms&quot;)
            govern your use of the PatternForge website and application.
          </p>
          <p className={`mt-4 max-w-2xl ${body}`}>
            By accessing or using PatternForge, you agree to these Terms.
          </p>
        </header>

        <div className="mt-12 space-y-12">
          <section
            id="use-of-service"
            aria-labelledby="use-heading"
            className="scroll-mt-24"
          >
            <h2 id="use-heading" className={sectionTitle}>
              1. Use of the service
            </h2>
            <p className={`mt-4 ${body}`}>
              PatternForge is a chess training application designed to help users
              improve pattern recognition through structured practice.
            </p>
            <p className={`mt-4 ${body}`}>
              You agree to use the service only for lawful purposes and in a way
              that does not harm, disrupt, or interfere with the platform or
              other users.
            </p>
          </section>

          <section
            id="accounts"
            aria-labelledby="accounts-heading"
            className="scroll-mt-24"
          >
            <h2 id="accounts-heading" className={sectionTitle}>
              2. Accounts
            </h2>
            <p className={`mt-4 ${body}`}>
              To access certain features, you may need to create an account.
            </p>
            <p className={`mt-4 ${body}`}>You are responsible for:</p>
            <ul className={`mt-3 ${list}`}>
              <li>maintaining the confidentiality of your account credentials</li>
              <li>all activity that occurs under your account</li>
            </ul>
            <p className={`mt-4 ${body}`}>
              If you believe your account has been compromised, you should notify
              us immediately.
            </p>
          </section>

          <section
            id="training-data"
            aria-labelledby="training-heading"
            className="scroll-mt-24"
          >
            <h2 id="training-heading" className={sectionTitle}>
              3. Training data and content
            </h2>
            <p className={`mt-4 ${body}`}>
              PatternForge allows you to create and interact with training data,
              including:
            </p>
            <ul className={`mt-3 ${list}`}>
              <li>training sets</li>
              <li>puzzle attempts and results</li>
              <li>cycles and progress data</li>
            </ul>
            <p className={`mt-4 ${body}`}>You retain ownership of the data you create.</p>
            <p className={`mt-4 ${body}`}>
              By using the service, you grant PatternForge permission to store
              and process this data solely for the purpose of operating and
              improving the service.
            </p>
          </section>

          <section
            id="acceptable-use"
            aria-labelledby="acceptable-heading"
            className="scroll-mt-24"
          >
            <h2 id="acceptable-heading" className={sectionTitle}>
              4. Acceptable use
            </h2>
            <p className={`mt-4 ${body}`}>You agree not to:</p>
            <ul className={`mt-3 ${list}`}>
              <li>misuse or attempt to break the system</li>
              <li>access data that does not belong to you</li>
              <li>interfere with the normal operation of the service</li>
              <li>
                use automated systems (bots, scripts) in a way that harms the
                platform
              </li>
              <li>
                reverse engineer or attempt to extract source code unless
                permitted by law
              </li>
            </ul>
          </section>

          <section
            id="intellectual-property"
            aria-labelledby="ip-heading"
            className="scroll-mt-24"
          >
            <h2 id="ip-heading" className={sectionTitle}>
              5. Intellectual property
            </h2>
            <p className={`mt-4 ${body}`}>
              All rights, title, and interest in PatternForge, including its
              design, code, branding, and content (excluding user-provided data),
              are owned by PatternForge.
            </p>
            <p className={`mt-4 ${body}`}>
              You may not copy, modify, distribute, or reproduce any part of the
              service without permission.
            </p>
          </section>

          <section
            id="availability"
            aria-labelledby="availability-heading"
            className="scroll-mt-24"
          >
            <h2 id="availability-heading" className={sectionTitle}>
              6. Service availability
            </h2>
            <p className={`mt-4 ${body}`}>
              PatternForge is provided on an &quot;as is&quot; and &quot;as
              available&quot; basis.
            </p>
            <p className={`mt-4 ${body}`}>
              We aim to provide a reliable service, but we do not guarantee that:
            </p>
            <ul className={`mt-3 ${list}`}>
              <li>the service will always be available</li>
              <li>the service will be free from errors or interruptions</li>
            </ul>
            <p className={`mt-4 ${body}`}>
              We may update, modify, or discontinue features at any time.
            </p>
          </section>

          <section
            id="liability"
            aria-labelledby="liability-heading"
            className="scroll-mt-24"
          >
            <h2 id="liability-heading" className={sectionTitle}>
              7. Limitation of liability
            </h2>
            <p className={`mt-4 ${body}`}>
              To the maximum extent permitted by law, PatternForge is not liable
              for:
            </p>
            <ul className={`mt-3 ${list}`}>
              <li>any indirect, incidental, or consequential damages</li>
              <li>loss of data, progress, or training history</li>
              <li>any issues resulting from use or inability to use the service</li>
            </ul>
            <p className={`mt-4 ${body}`}>
              Use of PatternForge is at your own risk.
            </p>
          </section>

          <section
            id="termination"
            aria-labelledby="termination-heading"
            className="scroll-mt-24"
          >
            <h2 id="termination-heading" className={sectionTitle}>
              8. Termination
            </h2>
            <p className={`mt-4 ${body}`}>
              We may suspend or terminate your access to PatternForge if you
              violate these Terms or misuse the service.
            </p>
            <p className={`mt-4 ${body}`}>
              You may stop using the service at any time.
            </p>
          </section>

          <section
            id="changes"
            aria-labelledby="changes-heading"
            className="scroll-mt-24"
          >
            <h2 id="changes-heading" className={sectionTitle}>
              9. Changes to these Terms
            </h2>
            <p className={`mt-4 ${body}`}>
              We may update these Terms from time to time.
            </p>
            <p className={`mt-4 ${body}`}>
              If we make material changes, we will update the effective date at
              the top of this page.
            </p>
            <p className={`mt-4 ${body}`}>
              Continued use of PatternForge after changes means you accept the
              updated Terms.
            </p>
          </section>

          <section
            id="governing-law"
            aria-labelledby="law-heading"
            className="scroll-mt-24"
          >
            <h2 id="law-heading" className={sectionTitle}>
              10. Governing law
            </h2>
            <p className={`mt-4 ${body}`}>
              These Terms are governed by the laws of Australia, unless otherwise
              required by applicable law.
            </p>
          </section>

          <section
            id="contact"
            aria-labelledby="contact-heading"
            className="scroll-mt-24"
          >
            <h2 id="contact-heading" className={sectionTitle}>
              11. Contact
            </h2>
            <p className={`mt-4 ${body}`}>
              If you have questions about these Terms, contact:
            </p>
            <p className={`mt-6 ${body}`}>
              <span className="font-medium text-foreground">PatternForge</span>
            </p>
            <p className={`mt-2 ${body}`}>
              Email:{" "}
              <a
                href={`mailto:${LEGAL_EMAIL}`}
                className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              >
                {LEGAL_EMAIL}
              </a>
            </p>
          </section>
        </div>

        <footer className="mt-16 border-t border-border pt-8">
          <p className={`text-sm ${body}`}>
            <Link
              href={ROUTES.home}
              className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              Back to home
            </Link>
            <span className="mx-2 text-muted-foreground" aria-hidden>
              ·
            </span>
            <Link
              href={ROUTES.app}
              className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              Open app
            </Link>
          </p>
        </footer>
      </article>
    </MarketingSubpageShell>
  );
}
