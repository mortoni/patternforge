/**
 * Stripe-hosted Payment Links for one-time donations.
 *
 * PatternForge stays backend-free: the app links directly to Stripe checkout.
 * No secret keys, API routes, or webhooks are used.
 *
 * ## Stripe Dashboard redirect URLs
 *
 * Configure each Payment Link in the Stripe Dashboard:
 *
 * - **Success URL:** `{SITE_ORIGIN}/support/success`
 *   Example (local): `http://localhost:3000/support/success`
 *   Example (prod): `https://chessforge.app/support/success`
 *
 * - **Cancel URL:** `{SITE_ORIGIN}/support`
 *   Example (local): `http://localhost:3000/support`
 *
 * `SITE_ORIGIN` should match `NEXT_PUBLIC_SITE_URL` when set.
 *
 * ## Environment variables
 *
 * Override individual links in `.env` (see README):
 *
 * - `NEXT_PUBLIC_STRIPE_DONATION_LINK_FIVE`
 * - `NEXT_PUBLIC_STRIPE_DONATION_LINK_TEN`
 * - `NEXT_PUBLIC_STRIPE_DONATION_LINK_TWENTY_FIVE`
 * - `NEXT_PUBLIC_STRIPE_DONATION_LINK_FIFTY`
 *
 * When unset, each tier falls back to its default in `STRIPE_DONATION_LINK_DEFAULTS`.
 * Invalid values (including README placeholders like `https://buy.stripe.com/...`) are ignored.
 */

export const STRIPE_DONATION_LINK_DEFAULTS = {
  five: "https://buy.stripe.com/6oUdRa4i35KOdmJ1rHco002",
  ten: "https://buy.stripe.com/9B63cw7ufehkciFeetco003",
  twentyFive: "https://buy.stripe.com/aFa6oIdSD1uy3M9c6lco004",
  fifty: "https://buy.stripe.com/9B66oI5m76OSfuR2vLco001",
} as const;

/** @deprecated Use {@link STRIPE_DONATION_LINK_DEFAULTS}. */
export const DEFAULT_STRIPE_DONATION_LINK = STRIPE_DONATION_LINK_DEFAULTS.five;

const STRIPE_PAYMENT_LINK_PATTERN =
  /^https:\/\/buy\.stripe\.com\/(?:test_)?[A-Za-z0-9]+$/;

function isValidStripePaymentLink(url: string | undefined): url is string {
  if (!url) return false;
  // README examples use `...` — treat as unset, not a real link.
  if (url.includes("...")) return false;
  return STRIPE_PAYMENT_LINK_PATTERN.test(url);
}

function resolveStripeDonationLink(
  envKey: string,
  fallback: string
): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env[envKey]?.trim()
      : undefined;
  if (isValidStripePaymentLink(fromEnv)) return fromEnv;
  if (
    fromEnv &&
    typeof process !== "undefined" &&
    process.env.NODE_ENV === "development"
  ) {
    console.warn(
      `[PatternForge] ${envKey} is missing or invalid (${fromEnv}). ` +
        "Use a full Stripe Payment Link URL from the Stripe Dashboard. " +
        `Falling back to ${fallback}.`
    );
  }
  return fallback;
}

export const STRIPE_DONATION_LINKS = {
  five: resolveStripeDonationLink(
    "NEXT_PUBLIC_STRIPE_DONATION_LINK_FIVE",
    STRIPE_DONATION_LINK_DEFAULTS.five
  ),
  ten: resolveStripeDonationLink(
    "NEXT_PUBLIC_STRIPE_DONATION_LINK_TEN",
    STRIPE_DONATION_LINK_DEFAULTS.ten
  ),
  twentyFive: resolveStripeDonationLink(
    "NEXT_PUBLIC_STRIPE_DONATION_LINK_TWENTY_FIVE",
    STRIPE_DONATION_LINK_DEFAULTS.twentyFive
  ),
  fifty: resolveStripeDonationLink(
    "NEXT_PUBLIC_STRIPE_DONATION_LINK_FIFTY",
    STRIPE_DONATION_LINK_DEFAULTS.fifty
  ),
} as const;

export type StripeDonationTier = keyof typeof STRIPE_DONATION_LINKS;

export type StripeDonationOption = {
  id: StripeDonationTier;
  amountLabel: string;
  helperText: string;
  href: string;
};

export const STRIPE_DONATION_OPTIONS: readonly StripeDonationOption[] = [
  {
    id: "five",
    amountLabel: "A$5",
    helperText: "A small thank-you.",
    href: STRIPE_DONATION_LINKS.five,
  },
  {
    id: "ten",
    amountLabel: "A$10",
    helperText: "Helps cover hosting.",
    href: STRIPE_DONATION_LINKS.ten,
  },
  {
    id: "twentyFive",
    amountLabel: "A$25",
    helperText: "Meaningful support.",
    href: STRIPE_DONATION_LINKS.twentyFive,
  },
  {
    id: "fifty",
    amountLabel: "A$50",
    helperText: "Generous support.",
    href: STRIPE_DONATION_LINKS.fifty,
  },
] as const;
