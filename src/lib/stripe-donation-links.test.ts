import { describe, it, expect, vi, afterEach } from "vitest";
import {
  DEFAULT_STRIPE_DONATION_LINK,
  STRIPE_DONATION_LINK_DEFAULTS,
  STRIPE_DONATION_LINKS,
  STRIPE_DONATION_OPTIONS,
} from "./stripe-donation-links";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("stripe-donation-links", () => {
  it("exposes all donation tiers with Stripe checkout URLs", () => {
    for (const key of ["five", "ten", "twentyFive", "fifty"] as const) {
      const href = STRIPE_DONATION_LINKS[key];
      expect(href).toMatch(/^https:\/\/buy\.stripe\.com\//);
    }
  });

  it("maps donation options to tier links", () => {
    expect(STRIPE_DONATION_OPTIONS).toHaveLength(4);
    expect(STRIPE_DONATION_OPTIONS.map((option) => option.amountLabel)).toEqual([
      "A$5",
      "A$10",
      "A$25",
      "A$50",
    ]);

    for (const option of STRIPE_DONATION_OPTIONS) {
      expect(option.href).toBe(STRIPE_DONATION_LINKS[option.id]);
      expect(option.href).toMatch(/^https:\/\//);
    }
  });

  it("uses distinct default links per tier when env vars are unset", () => {
    expect(STRIPE_DONATION_LINKS.five).toBe(STRIPE_DONATION_LINK_DEFAULTS.five);
    expect(STRIPE_DONATION_LINKS.ten).toBe(STRIPE_DONATION_LINK_DEFAULTS.ten);
    expect(STRIPE_DONATION_LINKS.twentyFive).toBe(
      STRIPE_DONATION_LINK_DEFAULTS.twentyFive
    );
    expect(STRIPE_DONATION_LINKS.fifty).toBe(STRIPE_DONATION_LINK_DEFAULTS.fifty);
    expect(DEFAULT_STRIPE_DONATION_LINK).toBe(STRIPE_DONATION_LINK_DEFAULTS.five);
  });

  it("ignores placeholder README-style env URLs", async () => {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_DONATION_LINK_FIVE", "https://buy.stripe.com/...");
    vi.resetModules();
    const mod = await import("./stripe-donation-links");
    expect(mod.STRIPE_DONATION_LINKS.five).toBe(mod.STRIPE_DONATION_LINK_DEFAULTS.five);
  });
});
