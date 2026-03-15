import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalyticsPage } from "./analytics-page";

const mockGetAnalyticsSummary = vi.fn();
const mockGetAccuracySeries = vi.fn();
const mockGetSessionDurationSeries = vi.fn();

vi.mock("@/services/analytics.service", () => ({
  getAnalyticsSummary: () => mockGetAnalyticsSummary(),
  getAccuracySeries: (...args: unknown[]) => mockGetAccuracySeries(...args),
  getSessionDurationSeries: (...args: unknown[]) =>
    mockGetSessionDurationSeries(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnalyticsSummary.mockResolvedValue({
    totalSessions: 2,
    totalAttempts: 20,
    totalCorrect: 16,
    totalSkipped: 2,
    overallAccuracy: 0.8,
    totalTrainingTimeMs: 120000,
    mistakesRemaining: 1,
  });
  mockGetAccuracySeries.mockResolvedValue([
    { label: "Set A", sessionId: "s1", accuracy: 0.9, endedAt: "2025-03-12T10:00:00Z" },
  ]);
  mockGetSessionDurationSeries.mockResolvedValue([
    { label: "Set A", sessionId: "s1", activeTimeMs: 60000, endedAt: "2025-03-12T10:00:00Z" },
  ]);
});

describe("AnalyticsPage", () => {
  it("shows header and summary when loaded", async () => {
    render(<AnalyticsPage />);
    expect(screen.getByText("Training Analytics")).toBeInTheDocument();
    expect(
      screen.getByText(/track your recent training volume/i)
    ).toBeInTheDocument();
    await screen.findByText("2");
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("renders chart sections with supplied data", async () => {
    render(<AnalyticsPage />);
    await screen.findByText("Session duration over time");
    expect(screen.getByText("Accuracy over time")).toBeInTheDocument();
  });
});
