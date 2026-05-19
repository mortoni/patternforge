import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketingFooter } from "./marketing-footer";

describe("MarketingFooter", () => {
  it("renders support link to /support", () => {
    render(<MarketingFooter />);

    expect(
      screen.getByRole("link", { name: /support patternforge/i })
    ).toHaveAttribute("href", "/support");
  });
});
