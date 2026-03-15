import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent, act } from "@testing-library/react";
import { SettingsPage } from "./settings-page";
import { SettingsProvider } from "../context/settings-context";

// SettingsProvider uses useSettings which hits Dexie; mock the repo so it returns defaults
const mockGetSettings = vi.fn();
const mockPutSettings = vi.fn();
const mockUpdateSettings = vi.fn();

vi.mock("@/repositories/settings.repository", () => ({
  getSettings: () => mockGetSettings(),
  putSettings: (data: unknown) => mockPutSettings(data),
  updateSettings: (patch: unknown) => mockUpdateSettings(patch),
}));

const defaultSettings = {
  id: "default" as const,
  theme: "system" as const,
  boardOrientation: "white" as const,
  lastTrainingSetId: undefined as string | undefined,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSettings.mockResolvedValue(defaultSettings);
  mockPutSettings.mockResolvedValue(undefined);
  mockUpdateSettings.mockResolvedValue(undefined);
});

describe("SettingsPage", () => {
  it("renders header and sections", async () => {
    render(
      <SettingsProvider>
        <SettingsPage />
      </SettingsProvider>
    );

    await screen.findByRole("heading", { name: /settings/i });
    expect(screen.getByText(/manage your training preferences/i)).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: /theme/i })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: /board orientation/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /training preferences/i })).toBeInTheDocument();
  });

  it("shows current theme and board orientation", async () => {
    render(
      <SettingsProvider>
        <SettingsPage />
      </SettingsProvider>
    );

    await screen.findByRole("radiogroup", { name: /theme/i });
    const themeGroup = screen.getByRole("radiogroup", { name: /theme/i });
    expect(within(themeGroup).getByRole("radio", { name: /system/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );

    const boardGroup = screen.getByRole("radiogroup", { name: /board orientation/i });
    expect(within(boardGroup).getByRole("radio", { name: /white/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("updates theme when option clicked", async () => {
    render(
      <SettingsProvider>
        <SettingsPage />
      </SettingsProvider>
    );

    await screen.findByRole("radiogroup", { name: /theme/i });
    mockGetSettings.mockResolvedValue({ ...defaultSettings, theme: "dark" });

    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: /dark/i }));
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: "dark" });
  });

  it("updates board orientation when option clicked", async () => {
    render(
      <SettingsProvider>
        <SettingsPage />
      </SettingsProvider>
    );

    await screen.findByRole("radiogroup", { name: /board orientation/i });
    mockGetSettings.mockResolvedValue({
      ...defaultSettings,
      boardOrientation: "black",
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: /black/i }));
    });

    await vi.waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        boardOrientation: "black",
      });
    });
  });
});
