import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import SupportSuccessPage from "./support-success-page";
import { ROUTES } from "@/lib/constants";

const mockTrackStripeSuccessReturn = vi.fn();

vi.mock("@/lib/donation-telemetry", () => ({
  trackStripeSuccessReturn: () => mockTrackStripeSuccessReturn(),
}));

vi.mock("@/components/shared/ThemeToggle", () => ({
  ThemeToggle: () => null,
}));

describe("SupportSuccessPage", () => {
  it("emits Stripe success return once per render cycle", async () => {
    const { rerender } = render(<SupportSuccessPage />);
    await waitFor(() =>
      expect(mockTrackStripeSuccessReturn).toHaveBeenCalledTimes(1)
    );
    rerender(<SupportSuccessPage />);
    expect(mockTrackStripeSuccessReturn).toHaveBeenCalledTimes(1);
  });
  it("renders thank-you heading and body copy", () => {
    render(<SupportSuccessPage />);

    expect(
      screen.getByRole("heading", {
        name: /thank you for supporting patternforge/i,
        level: 1,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /your support helps keep training free and independently maintained/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /you can now return to your training whenever you are ready/i
      )
    ).toBeInTheDocument();
  });

  it("links Return to training to the canonical training route", () => {
    render(<SupportSuccessPage />);

    expect(
      screen.getByRole("link", { name: /return to training/i })
    ).toHaveAttribute("href", ROUTES.training);
  });

  it("links Back to support to /support", () => {
    render(<SupportSuccessPage />);

    expect(
      screen.getByRole("link", { name: /back to support/i })
    ).toHaveAttribute("href", ROUTES.support);
  });

  it("exposes accessible post-donation navigation on mobile layouts", () => {
    render(
      <div style={{ width: 320 }}>
        <SupportSuccessPage />
      </div>
    );

    expect(
      screen.getByRole("navigation", { name: /after donation/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("support-success-content")).toHaveClass(
      "overflow-x-hidden"
    );
    expect(screen.getByRole("link", { name: /return to training/i })).toHaveClass(
      "min-h-11"
    );
  });
});
