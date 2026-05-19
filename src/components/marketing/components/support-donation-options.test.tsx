import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SupportDonationOptions } from "./support-donation-options";
import { STRIPE_DONATION_OPTIONS } from "@/lib/stripe-donation-links";

const mockTrackStripeCheckoutOpen = vi.fn();

vi.mock("@/lib/donation-telemetry", () => ({
  trackStripeCheckoutOpen: (...args: unknown[]) =>
    mockTrackStripeCheckoutOpen(...args),
  stripeTierToTelemetryAmount: (tier: string) => {
    if (tier === "five") return "5";
    if (tier === "ten") return "10";
    if (tier === "twentyFive") return "25";
    return "custom";
  },
}));

describe("SupportDonationOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders donation amount links with valid Stripe hrefs", () => {
    render(<SupportDonationOptions />);

    for (const option of STRIPE_DONATION_OPTIONS) {
      const link = screen.getByRole("link", {
        name: `Donate ${option.amountLabel} via Stripe`,
      });
      expect(link).toHaveAttribute("href", option.href);
      expect(link).not.toHaveAttribute("target");
      expect(link.getAttribute("href")).toMatch(/^https:\/\/buy\.stripe\.com\//);
    }

    expect(screen.getByText(/a small thank-you/i)).toBeInTheDocument();
    expect(screen.getByText(/generous support/i)).toBeInTheDocument();
  });

  it("emits Stripe checkout open when a donation tier is clicked", () => {
    render(<SupportDonationOptions />);

    const link = screen.getByRole("link", {
      name: "Donate A$10 via Stripe",
    });
    fireEvent.click(link);

    expect(mockTrackStripeCheckoutOpen).toHaveBeenCalledWith({ amount: "10" });
  });

  it("prevents duplicate checkout telemetry on double tap", () => {
    render(<SupportDonationOptions />);

    const link = screen.getByTestId("stripe-donation-five");
    fireEvent.click(link);
    fireEvent.click(link);

    expect(mockTrackStripeCheckoutOpen).toHaveBeenCalledTimes(1);
    expect(link).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(/opening stripe/i)).toBeInTheDocument();
  });

  it("uses comfortable touch sizing on donation cards", () => {
    render(<SupportDonationOptions />);

    expect(screen.getByTestId("support-donation-options")).toBeInTheDocument();
    expect(screen.getByTestId("stripe-donation-five").className).toMatch(
      /min-h-\[8\.25rem\]/
    );
  });
});
