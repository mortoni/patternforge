import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  within,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
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
  boardStyle: "blueprint" as const,
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
    expect(screen.getByRole("radiogroup", { name: /board orientation/i })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: /board style/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /training preferences/i })).toBeInTheDocument();
  });

  it("shows current board orientation", async () => {
    render(
      <SettingsProvider>
        <SettingsPage />
      </SettingsProvider>
    );

    const boardGroup = screen.getByRole("radiogroup", { name: /board orientation/i });
    expect(within(boardGroup).getByRole("radio", { name: /white/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("updates board orientation when option clicked", async () => {
    render(
      <SettingsProvider>
        <SettingsPage />
      </SettingsProvider>
    );

    const boardGroup = await screen.findByRole("radiogroup", {
      name: /board orientation/i,
    });
    const blackRadio = within(boardGroup).getByRole("radio", {
      name: /^black$/i,
    });
    await waitFor(() => {
      expect(blackRadio).not.toBeDisabled();
    });
    mockGetSettings.mockResolvedValue({
      ...defaultSettings,
      boardOrientation: "black",
    });

    await act(async () => {
      fireEvent.click(blackRadio);
    });

    await vi.waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        boardOrientation: "black",
      });
    });
  });

  it("updates board style when option clicked", async () => {
    render(
      <SettingsProvider>
        <SettingsPage />
      </SettingsProvider>
    );

    const styleGroup = await screen.findByRole("radiogroup", {
      name: /board style/i,
    });
    const blueprintRadio = within(styleGroup).getByRole("radio", {
      name: /^blueprint\./i,
    });
    await waitFor(() => {
      expect(blueprintRadio).not.toBeDisabled();
    });
    mockGetSettings.mockResolvedValue({
      ...defaultSettings,
      boardStyle: "blueprint",
    });

    await act(async () => {
      fireEvent.click(blueprintRadio);
    });

    await vi.waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        boardStyle: "blueprint",
      });
    });
  });
});
