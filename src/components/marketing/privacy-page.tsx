import Link from "next/link";
import { MarketingSubpageShell } from "@/components/marketing/components/marketing-subpage-shell";
import { ROUTES } from "@/lib/constants";

const CONTACT_EMAIL = "privacy@patternforge.app";

const sectionTitle = "text-lg font-medium tracking-tight text-foreground";
const body = "text-[15px] leading-relaxed text-muted-foreground";
const list = "ml-5 list-disc space-y-2 text-[15px] leading-relaxed text-muted-foreground";

export default function PrivacyPage() {
  return (
    <MarketingSubpageShell>
      <article className="pb-16">
        <header className="border-b border-border pb-10">
          <h1 className="text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className={`mt-4 text-sm ${body}`}>
            <span className="font-medium text-foreground">Effective date:</span>{" "}
            March 21, 2026
          </p>
          <p className={`mt-4 max-w-2xl ${body}`}>
            This policy explains what information PatternForge collects, how we
            use it, and the choices you have. We aim to be straightforward—this
            is an independent chess training product, not a data broker.
          </p>
        </header>

        <div className="mt-12 space-y-12">
          <section id="who-we-are" aria-labelledby="who-heading" className="scroll-mt-24">
            <h2 id="who-heading" className={sectionTitle}>
              Who we are
            </h2>
            <p className={`mt-4 ${body}`}>
              PatternForge is a chess tactics and pattern-training application.
              Depending on how you access the product, it may run in your
              browser and store some data locally on your device to support
              training features (such as cycles, sets, and progress). When we say
              &quot;we,&quot; &quot;us,&quot; or &quot;our,&quot; we mean the
              team operating PatternForge.
            </p>
          </section>

          <section
            id="information-we-collect"
            aria-labelledby="collect-heading"
            className="scroll-mt-24"
          >
            <h2 id="collect-heading" className={sectionTitle}>
              Information we collect
            </h2>
            <p className={`mt-4 ${body}`}>
              We only collect information that helps the product work or that
              you choose to give us. This may include:
            </p>
            <ul className={`mt-4 ${list}`}>
              <li>
                <span className="text-foreground">Account or contact details</span>{" "}
                if we offer sign-in or support (for example, email address).
              </li>
              <li>
                <span className="text-foreground">Device and technical data</span>{" "}
                such as browser type, approximate region (if inferred from
                network requests), and basic diagnostics needed to keep the
                service reliable.
              </li>
              <li>
                <span className="text-foreground">Content you submit</span>{" "}
                when you contact us (for example, support messages).
              </li>
            </ul>
            <p className={`mt-4 ${body}`}>
              We do not ask for sensitive categories of data (such as health
              information) to use PatternForge for chess training.
            </p>
          </section>

          <section
            id="how-we-use-information"
            aria-labelledby="use-heading"
            className="scroll-mt-24"
          >
            <h2 id="use-heading" className={sectionTitle}>
              How we use your information
            </h2>
            <p className={`mt-4 ${body}`}>
              We use information for limited, legitimate purposes, including to:
            </p>
            <ul className={`mt-4 ${list}`}>
              <li>Provide, maintain, and improve PatternForge.</li>
              <li>
                Remember your preferences and sync training-related state when
                that feature is available.
              </li>
              <li>Respond to support requests and communicate about the product.</li>
              <li>
                Protect the service, investigate abuse, and comply with legal
                obligations.
              </li>
            </ul>
          </section>

          <section
            id="training-data"
            aria-labelledby="training-heading"
            className="scroll-mt-24"
          >
            <h2 id="training-heading" className={sectionTitle}>
              Training data and chess activity
            </h2>
            <p className={`mt-4 ${body}`}>
              PatternForge is built around structured tactical training: sets,
              cycles, attempts, and related progress. Depending on your version of
              the app, some of this information may be stored{" "}
              <span className="text-foreground">on your device</span> (for
              example, in browser storage) so you can train offline or without
              sending every move to a server. If and when cloud sync or accounts
              exist, we will process that training data only to operate the
              features you use.
            </p>
            <p className={`mt-4 ${body}`}>
              We do not sell your puzzle history or use it to advertise
              unrelated products.
            </p>
          </section>

          <section
            id="analytics-cookies"
            aria-labelledby="analytics-heading"
            className="scroll-mt-24"
          >
            <h2 id="analytics-heading" className={sectionTitle}>
              Analytics and cookies
            </h2>
            <p className={`mt-4 ${body}`}>
              We may use a small number of cookies or similar technologies to
              keep you signed in, remember settings (such as theme), or
              understand how the app is used in aggregate (for example, which
              screens load slowly). Where we use third-party analytics, we
              choose providers proportionate to an indie product and configure
              them to minimise unnecessary tracking.
            </p>
            <p className={`mt-4 ${body}`}>
              You can control many cookies through your browser settings. If you
              block essential cookies, parts of the app may not work as
              expected.
            </p>
          </section>

          <section
            id="how-we-share"
            aria-labelledby="share-heading"
            className="scroll-mt-24"
          >
            <h2 id="share-heading" className={sectionTitle}>
              How we share information
            </h2>
            <p className={`mt-4 ${body}`}>
              We do not sell your personal information. We may share information
              only in these situations:
            </p>
            <ul className={`mt-4 ${list}`}>
              <li>
                <span className="text-foreground">Service providers</span> who
                help us host, secure, or operate the product (for example,
                infrastructure or email delivery), bound by confidentiality and
                instructions.
              </li>
              <li>
                <span className="text-foreground">Legal and safety</span> when
                we believe disclosure is required by law or necessary to protect
                users or the service.
              </li>
              <li>
                <span className="text-foreground">Business transfers</span> if
                PatternForge is involved in a merger or acquisition; we will
                notify you if your information becomes subject to a new policy.
              </li>
            </ul>
          </section>

          <section
            id="storage-security"
            aria-labelledby="security-heading"
            className="scroll-mt-24"
          >
            <h2 id="security-heading" className={sectionTitle}>
              Data storage and security
            </h2>
            <p className={`mt-4 ${body}`}>
              We use reasonable technical and organisational measures to
              protect information—encryption in transit where appropriate,
              access limits, and careful dependency management. No online
              service can guarantee perfect security; if we learn of a breach
              that affects you, we will notify you as required by law and in line
              with good practice.
            </p>
          </section>

          <section
            id="retention"
            aria-labelledby="retention-heading"
            className="scroll-mt-24"
          >
            <h2 id="retention-heading" className={sectionTitle}>
              Data retention
            </h2>
            <p className={`mt-4 ${body}`}>
              We keep information only as long as needed for the purposes above
              or as the law requires. Training data stored locally on your
              device stays there until you clear it or uninstall the app. Server
              copies, if any, are deleted or anonymised when no longer needed
              for running the service.
            </p>
          </section>

          <section
            id="your-choices"
            aria-labelledby="choices-heading"
            className="scroll-mt-24"
          >
            <h2 id="choices-heading" className={sectionTitle}>
              Your choices
            </h2>
            <p className={`mt-4 ${body}`}>
              Depending on where you live, you may have rights to access,
              correct, export, or delete certain personal information, or to
              object to some processing. You can also stop using PatternForge at
              any time. To exercise your rights, contact us at the email below;
              we will respond within a reasonable timeframe.
            </p>
          </section>

          <section
            id="children"
            aria-labelledby="children-heading"
            className="scroll-mt-24"
          >
            <h2 id="children-heading" className={sectionTitle}>
              Children&apos;s privacy
            </h2>
            <p className={`mt-4 ${body}`}>
              PatternForge is not directed at children under 13 (or the minimum
              age required in your country). We do not knowingly collect
              personal information from children. If you believe a child has
              provided us information, contact us and we will take appropriate
              steps to delete it.
            </p>
          </section>

          <section
            id="international"
            aria-labelledby="international-heading"
            className="scroll-mt-24"
          >
            <h2 id="international-heading" className={sectionTitle}>
              International users
            </h2>
            <p className={`mt-4 ${body}`}>
              If you use PatternForge from outside the country where our servers
              or providers are located, your information may be processed in
              those regions. Where required, we use appropriate safeguards (such
              as standard contractual clauses) for international transfers.
            </p>
          </section>

          <section
            id="changes"
            aria-labelledby="changes-heading"
            className="scroll-mt-24"
          >
            <h2 id="changes-heading" className={sectionTitle}>
              Changes to this policy
            </h2>
            <p className={`mt-4 ${body}`}>
              We may update this Privacy Policy from time to time. When we do,
              we will change the effective date at the top and, for material
              changes, provide a clearer notice in the app or by email where we
              have your address. Continued use after the update means you
              accept the revised policy.
            </p>
          </section>

          <section
            id="contact"
            aria-labelledby="contact-heading"
            className="scroll-mt-24"
          >
            <h2 id="contact-heading" className={sectionTitle}>
              Contact
            </h2>
            <p className={`mt-4 ${body}`}>
              Questions about this policy or your data? Reach us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              >
                {CONTACT_EMAIL}
              </a>
              .
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
