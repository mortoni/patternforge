import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/shared/PageHeader";

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Test Page" />);
    expect(
      screen.getByRole("heading", { name: /test page/i })
    ).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <PageHeader title="Test" description="Test description" />
    );
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });
});
