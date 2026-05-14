import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSettingsWithDefaults,
  updateTheme,
  updateBoardOrientation,
  updateBoardStyle,
  SETTINGS_DEFAULTS,
} from "./settings.service";

const mockGetSettings = vi.fn();
const mockUpdateSettings = vi.fn();
const mockPutSettings = vi.fn();

vi.mock("@/repositories/settings.repository", () => ({
  getSettings: () => mockGetSettings(),
  updateSettings: (patch: unknown) => mockUpdateSettings(patch),
  putSettings: (data: unknown) => mockPutSettings(data),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("settings.service", () => {
  describe("getSettingsWithDefaults", () => {
    it("returns normalized settings when present (backfills boardStyle)", async () => {
      const existing = {
        id: "default",
        theme: "dark" as const,
        boardOrientation: "black" as const,
        lastTrainingSetId: "set-1",
      };
      mockGetSettings.mockResolvedValue(existing);

      const result = await getSettingsWithDefaults();

      expect(result).toEqual({
        ...existing,
        boardStyle: "classic",
      });
      expect(mockPutSettings).not.toHaveBeenCalled();
    });

    it("creates defaults and returns them when settings missing", async () => {
      mockGetSettings.mockResolvedValue(undefined);
      mockPutSettings.mockResolvedValue(undefined);

      const result = await getSettingsWithDefaults();

      expect(mockPutSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "default",
          theme: SETTINGS_DEFAULTS.theme,
          boardOrientation: SETTINGS_DEFAULTS.boardOrientation,
          boardStyle: SETTINGS_DEFAULTS.boardStyle,
          lastTrainingSetId: undefined,
        })
      );
      expect(result.theme).toBe("system");
      expect(result.boardOrientation).toBe("white");
      expect(result.boardStyle).toBe("classic");
    });
  });

  describe("updateTheme", () => {
    it("updates theme and returns new settings", async () => {
      mockUpdateSettings.mockResolvedValue(undefined);
      mockGetSettings.mockResolvedValue({
        id: "default",
        theme: "dark",
        boardOrientation: "white",
        boardStyle: "classic",
      });

      const result = await updateTheme("dark");

      expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: "dark" });
      expect(result.theme).toBe("dark");
    });
  });

  describe("updateBoardOrientation", () => {
    it("updates board orientation and returns new settings", async () => {
      mockUpdateSettings.mockResolvedValue(undefined);
      mockGetSettings.mockResolvedValue({
        id: "default",
        theme: "system",
        boardOrientation: "black",
        boardStyle: "blueprint",
      });

      const result = await updateBoardOrientation("black");

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        boardOrientation: "black",
      });
      expect(result.boardOrientation).toBe("black");
    });
  });

  describe("updateBoardStyle", () => {
    it("updates board style and returns new settings", async () => {
      mockUpdateSettings.mockResolvedValue(undefined);
      mockGetSettings.mockResolvedValue({
        id: "default",
        theme: "system",
        boardOrientation: "white",
        boardStyle: "blueprint",
      });

      const result = await updateBoardStyle("blueprint");

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        boardStyle: "blueprint",
      });
      expect(result.boardStyle).toBe("blueprint");
    });
  });
});
