import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SupportPatternForgePrompt } from "./SupportPatternForgePrompt";
import { ROUTES } from "@/lib/constants";

const mockCanShow = vi.fn();
const mockDismiss = vi.fn();
const mockMarkSupported = vi.fn();
const mockRecordShown = vi.fn();
const mockMeetsMilestone = vi.fn();
const mockTrackSupportCtaClick = vi.fn();

vi.mock("@/lib/support-prompt-storage", () => ({
  canShowSupportPrompt: () => mockCanShow(),
  dismissSupportPrompt: () => mockDismiss(),
  markUserAsSupported: () => mockMarkSupported(),
  recordSupportPromptShown: () => mockRecordShown(),
}));

vi.mock("@/lib/donation-telemetry", () => ({
  trackSupportCtaClick: (...args: unknown[]) => mockTrackSupportCtaClick(...args),
}));

vi.mock("@/services/support-prompt-eligibility.service", () => ({
  meetsSupportPromptMilestone: () => mockMeetsMilestone(),
}));

describe("SupportPatternForgePrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanShow.mockReturnValue(true);
    mockMeetsMilestone.mockResolvedValue(true);
  });

  it("renders calm copy when eligible and not suppressed", async () => {
    render(<SupportPatternForgePrompt source="reflection" />);

    expect(
      await screen.findByTestId("support-patternforge-prompt")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Support PatternForge" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/patternforge is free and independently maintained/i)
    ).toBeInTheDocument();
  });

  it("does not render when suppressed by cooldown or dismissal", async () => {
    mockCanShow.mockReturnValue(false);
    render(<SupportPatternForgePrompt source="reflection" />);

    await waitFor(() => {
      expect(mockMeetsMilestone).not.toHaveBeenCalled();
    });
    expect(
      screen.queryByTestId("support-patternforge-prompt")
    ).not.toBeInTheDocument();
  });

  it("does not render before milestones are met", async () => {
    mockMeetsMilestone.mockResolvedValue(false);
    render(<SupportPatternForgePrompt source="reflection" />);

    await waitFor(() => {
      expect(mockMeetsMilestone).toHaveBeenCalled();
    });
    expect(
      screen.queryByTestId("support-patternforge-prompt")
    ).not.toBeInTheDocument();
  });

  it("records shown state, tracks CTA source, and links to /support", async () => {
    render(<SupportPatternForgePrompt source="cycle_completion" />);

    const link = await screen.findByRole("link", { name: "Support the project" });
    expect(link).toHaveAttribute("href", ROUTES.support);
    expect(mockRecordShown).toHaveBeenCalledTimes(1);
    fireEvent.click(link);
    expect(mockTrackSupportCtaClick).toHaveBeenCalledWith("cycle_completion");
    expect(mockMarkSupported).toHaveBeenCalledTimes(1);
  });

  it("dismisses on Maybe later and records short suppression", async () => {
    render(<SupportPatternForgePrompt source="reflection" />);

    fireEvent.click(await screen.findByRole("button", { name: "Maybe later" }));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByTestId("support-patternforge-prompt")
    ).not.toBeInTheDocument();
  });
});
