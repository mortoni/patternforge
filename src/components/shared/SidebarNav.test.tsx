import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarNav } from "./SidebarNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/settings",
}));

describe("SidebarNav", () => {
  it("renders support link in secondary navigation", () => {
    render(<SidebarNav />);

    expect(
      screen.getByRole("link", { name: /support patternforge/i })
    ).toHaveAttribute("href", "/support");
  });

  it("renders primary app navigation links", () => {
    render(<SidebarNav />);

    expect(screen.getByRole("link", { name: /^training$/i })).toHaveAttribute(
      "href",
      "/app/training"
    );
    expect(
      screen.getByRole("link", { name: /training sets/i })
    ).toHaveAttribute("href", "/app/sets");
  });
});
