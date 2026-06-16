import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { BoardStyleCard } from "./board-style-card";
import { BOARD_STYLE_MAP } from "@/lib/chess/board-styles";

vi.mock("../hooks/use-effective-app-color-scheme", () => ({
  useEffectiveAppColorScheme: () => "light" as const,
}));

describe("BoardStyleCard", () => {
  it("renders all board style options with labels and descriptions", () => {
    render(<BoardStyleCard value="blueprint" onChange={() => {}} />);

    const group = screen.getByRole("radiogroup", { name: /board style/i });
    expect(within(group).getAllByRole("radio")).toHaveLength(3);

    for (const id of ["classic", "classic-lichess", "blueprint"] as const) {
      const def = BOARD_STYLE_MAP[id];
      const ariaLabel = def.description
        ? `${def.label}. ${def.description}`
        : def.label;
      const radio = within(group).getByRole("radio", { name: ariaLabel });
      expect(radio).toBeInTheDocument();
      expect(radio).toHaveAttribute(
        "aria-checked",
        id === "blueprint" ? "true" : "false"
      );
    }
  });

  it("marks Classic (Lichess) as selected when value is classic-lichess", () => {
    render(<BoardStyleCard value="classic-lichess" onChange={() => {}} />);

    const group = screen.getByRole("radiogroup", { name: /board style/i });
    const lichessRadio = within(group).getByRole("radio", {
      name: /classic \(lichess\)/i,
    });
    expect(lichessRadio).toHaveAttribute("aria-checked", "true");
  });
});
