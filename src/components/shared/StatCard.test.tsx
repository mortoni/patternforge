import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "@/components/shared/StatCard";

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Sessions" value="42" />);
    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
