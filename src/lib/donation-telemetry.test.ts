import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  clearDonationTelemetrySessionMarks,
  DONATION_EVENT,
  DONATION_TELEMETRY_SESSION_PREFIX,
  stripeTierToTelemetryAmount,
  trackStripeCheckoutOpen,
  trackStripeSuccessReturn,
  trackSupportCtaClick,
  trackSupportPageView,
} from "./donation-telemetry";

const mockTrack = vi.fn();

vi.mock("@vercel/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

describe("donation-telemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDonationTelemetrySessionMarks();
  });

  afterEach(() => {
    clearDonationTelemetrySessionMarks();
  });

  it("tracks support page view once per session", () => {
    trackSupportPageView();
    trackSupportPageView();

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith(DONATION_EVENT.supportPageView);
    expect(
      window.sessionStorage.getItem(
        `${DONATION_TELEMETRY_SESSION_PREFIX}${DONATION_EVENT.supportPageView}`
      )
    ).toBe("1");
  });

  it("tracks support CTA click with source", () => {
    trackSupportCtaClick("reflection");
    expect(mockTrack).toHaveBeenCalledWith(DONATION_EVENT.supportCtaClick, {
      source: "reflection",
    });
  });

  it("tracks Stripe checkout open with amount and currency", () => {
    trackStripeCheckoutOpen({ amount: "10" });
    expect(mockTrack).toHaveBeenCalledWith(
      DONATION_EVENT.stripeCheckoutOpen,
      { amount: "10", currency: "AUD" }
    );
  });

  it("tracks Stripe success return once per session", () => {
    trackStripeSuccessReturn();
    trackStripeSuccessReturn();
    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith(
      DONATION_EVENT.stripeSuccessReturn
    );
  });

  it("maps Stripe tiers to telemetry amounts", () => {
    expect(stripeTierToTelemetryAmount("five")).toBe("5");
    expect(stripeTierToTelemetryAmount("ten")).toBe("10");
    expect(stripeTierToTelemetryAmount("twentyFive")).toBe("25");
    expect(stripeTierToTelemetryAmount("fifty")).toBe("custom");
  });

  it("fails silently when track throws", () => {
    mockTrack.mockImplementationOnce(() => {
      throw new Error("analytics down");
    });
    expect(() => trackSupportCtaClick("footer")).not.toThrow();
  });

  it("records events on window.__donationTelemetryEvents when present", () => {
    (
      window as Window & {
        __donationTelemetryEvents?: Array<{ name: string; data?: unknown }>;
      }
    ).__donationTelemetryEvents = [];
    trackSupportCtaClick("footer");
    expect(
      (
        window as Window & {
          __donationTelemetryEvents?: Array<{ name: string; data?: unknown }>;
        }
      ).__donationTelemetryEvents
    ).toEqual([{ name: DONATION_EVENT.supportCtaClick, data: { source: "footer" } }]);
    delete (
      window as Window & {
        __donationTelemetryEvents?: Array<{ name: string; data?: unknown }>;
      }
    ).__donationTelemetryEvents;
  });
});
