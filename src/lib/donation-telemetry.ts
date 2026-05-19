/**
 * Lightweight, anonymous donation UX telemetry via Vercel Analytics.
 * No donor identity, payment data, wallet addresses, or persistent profiles.
 */

import { track } from "@vercel/analytics";
import type { StripeDonationTier } from "@/lib/stripe-donation-links";

export const DONATION_EVENT = {
  supportPageView: "support_page_view",
  supportCtaClick: "support_cta_click",
  stripeCheckoutOpen: "donation_stripe_checkout_open",
  stripeSuccessReturn: "donation_stripe_success_return",
} as const;

export type SupportCtaSource =
  | "reflection"
  | "cycle_completion"
  | "settings"
  | "footer"
  | "support_page"
  | "sidebar";

export type DonationStripeAmount = "5" | "10" | "25" | "custom";

export const DONATION_STRIPE_CURRENCY = "AUD" as const;

/** sessionStorage — prevent duplicate page-view events on re-render / Strict Mode. */
export const DONATION_TELEMETRY_SESSION_PREFIX =
  "patternforge-donation-telemetry-fired:";

function sendEvent(
  name: string,
  data?: Record<string, string | number | boolean | null>
): void {
  try {
    if (data != null) {
      track(name, data);
    } else {
      track(name);
    }
  } catch {
    // Never block UX if analytics fails.
  }

  if (typeof window !== "undefined") {
    const events = (
      window as Window & {
        __donationTelemetryEvents?: Array<{
          name: string;
          data?: Record<string, string | number | boolean | null>;
        }>;
      }
    ).__donationTelemetryEvents;
    if (events) {
      events.push({ name, data });
    }
  }
}

function trackOncePerSession(eventName: string, send: () => void): void {
  if (typeof window === "undefined") return;

  const key = `${DONATION_TELEMETRY_SESSION_PREFIX}${eventName}`;
  try {
    if (window.sessionStorage.getItem(key) === "1") return;
    send();
    window.sessionStorage.setItem(key, "1");
  } catch {
    send();
  }
}

export function trackSupportPageView(): void {
  trackOncePerSession(DONATION_EVENT.supportPageView, () => {
    sendEvent(DONATION_EVENT.supportPageView);
  });
}

export function trackSupportCtaClick(source: SupportCtaSource): void {
  sendEvent(DONATION_EVENT.supportCtaClick, { source });
}

export function trackStripeCheckoutOpen(options: {
  amount: DonationStripeAmount;
  currency?: typeof DONATION_STRIPE_CURRENCY;
}): void {
  sendEvent(DONATION_EVENT.stripeCheckoutOpen, {
    amount: options.amount,
    currency: options.currency ?? DONATION_STRIPE_CURRENCY,
  });
}

/** User landed on /support/success — not verified payment completion. */
export function trackStripeSuccessReturn(): void {
  trackOncePerSession(DONATION_EVENT.stripeSuccessReturn, () => {
    sendEvent(DONATION_EVENT.stripeSuccessReturn);
  });
}

export function stripeTierToTelemetryAmount(
  tier: StripeDonationTier
): DonationStripeAmount {
  switch (tier) {
    case "five":
      return "5";
    case "ten":
      return "10";
    case "twentyFive":
      return "25";
    default:
      return "custom";
  }
}

/** Test helper — clears session dedupe marks only. */
export function clearDonationTelemetrySessionMarks(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith(DONATION_TELEMETRY_SESSION_PREFIX)) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}
