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

  it("defaults board orientation to side to move", async () => {
    render(
      <SettingsProvider>
        <SettingsPage />
      </SettingsProvider>
    );

    const boardGroup = screen.getByRole("radiogroup", { name: /board orientation/i });
    // Settings without an explicit autoBoardOrientation follow the side to move.
    expect(
      within(boardGroup).getByRole("radio", { name: /side to move/i })
    ).toHaveAttribute("aria-checked", "true");
    expect(within(boardGroup).getByRole("radio", { name: /white/i })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("shows an explicit board orientation when auto is off", async () => {
    mockGetSettings.mockResolvedValue({
      ...defaultSettings,
      autoBoardOrientation: false,
    });

    render(
      <SettingsProvider>
        <SettingsPage />
      </SettingsProvider>
    );

    const boardGroup = screen.getByRole("radiogroup", { name: /board orientation/i });
    expect(
      await within(boardGroup).findByRole("radio", { name: /white/i })
    ).toHaveAttribute("aria-checked", "true");
    expect(
      within(boardGroup).getByRole("radio", { name: /side to move/i })
    ).toHaveAttribute("aria-checked", "false");
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
    expect(within(styleGroup).getAllByRole("radio")).toHaveLength(3);

    const lichessRadio = within(styleGroup).getByRole("radio", {
      name: /classic \(lichess\)/i,
    });
    await waitFor(() => {
      expect(lichessRadio).not.toBeDisabled();
    });
    mockGetSettings.mockResolvedValue({
      ...defaultSettings,
      boardStyle: "classic-lichess",
    });

    await act(async () => {
      fireEvent.click(lichessRadio);
    });

    await vi.waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        boardStyle: "classic-lichess",
      });
    });
  });
});
