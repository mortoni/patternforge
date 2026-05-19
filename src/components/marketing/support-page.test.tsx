import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SupportPage from "./support-page";
import { STRIPE_DONATION_OPTIONS } from "@/lib/stripe-donation-links";
import {
  ACTIVE_CRYPTO_DONATION_OPTIONS,
} from "@/lib/crypto-donation-options";

const mockTrackSupportPageView = vi.fn();

vi.mock("@/lib/donation-telemetry", () => ({
  trackSupportPageView: () => mockTrackSupportPageView(),
  trackStripeCheckoutOpen: vi.fn(),
  stripeTierToTelemetryAmount: (tier: string) =>
    tier === "fifty" ? "custom" : tier.replace("twentyFive", "25").replace("five", "5"),
}));

vi.mock("@/components/shared/ThemeToggle", () => ({
  ThemeToggle: () => null,
}));

describe("SupportPage", () => {
  it("emits support page view once per render cycle", async () => {
    const { rerender } = render(<SupportPage />);
    await waitFor(() =>
      expect(mockTrackSupportPageView).toHaveBeenCalledTimes(1)
    );
    rerender(<SupportPage />);
    expect(mockTrackSupportPageView).toHaveBeenCalledTimes(1);
  });
  it("renders title and intro message", () => {
    render(<SupportPage />);

    expect(
      screen.getByRole("heading", { name: /support patternforge/i, level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /optional support helps keep training accessible for everyone/i
      ).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders creator note", () => {
    render(<SupportPage />);

    expect(
      screen.getByText(/personal training project inspired by disciplined repetition/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /about this project/i, level: 2 })
    ).toBeInTheDocument();
  });

  it("renders Stripe donation options with valid hrefs", () => {
    render(<SupportPage />);

    expect(
      screen.getByRole("heading", { name: /donate with card/i, level: 3 })
    ).toBeInTheDocument();

    for (const option of STRIPE_DONATION_OPTIONS) {
      const link = screen.getByRole("link", {
        name: `Donate ${option.amountLabel} via Stripe`,
      });
      expect(link).toHaveAttribute("href", option.href);
    }
  });

  it("renders crypto donation section", () => {
    render(<SupportPage />);

    expect(
      screen.getByRole("heading", { name: /crypto support/i, level: 3 })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/send funds only on the selected network/i)
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /copy address/i })).toHaveLength(
      ACTIVE_CRYPTO_DONATION_OPTIONS.length
    );
    expect(screen.queryByText(/TODO_ADD_/)).not.toBeInTheDocument();
  });

  it("uses mobile-safe page layout without horizontal overflow", () => {
    render(
      <div style={{ width: 320 }}>
        <SupportPage />
      </div>
    );

    expect(screen.getByTestId("support-page-content")).toHaveClass(
      "overflow-x-hidden"
    );
    expect(screen.getByTestId("support-donation-options")).toBeInTheDocument();
  });
});
