import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SupportCryptoDonations } from "./support-crypto-donations";
import { ACTIVE_CRYPTO_DONATION_OPTIONS } from "@/lib/crypto-donation-options";

describe("SupportCryptoDonations", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders only configured crypto options", () => {
    render(<SupportCryptoDonations />);

    expect(
      screen.getByRole("heading", { name: /crypto support/i, level: 3 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^bitcoin$/i, level: 4 })
    ).toBeInTheDocument();
    expect(screen.getByText(/lightning network/i)).toBeInTheDocument();
    expect(screen.queryByText("ERC20")).not.toBeInTheDocument();
    expect(screen.queryByText("TRC20")).not.toBeInTheDocument();
    expect(screen.queryByText(/TODO_ADD_/)).not.toBeInTheDocument();
  });

  it("renders network warning and privacy note", () => {
    render(<SupportCryptoDonations />);

    expect(
      screen.getByText(/send funds only on the selected network/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not require an account to donate/i)
    ).toBeInTheDocument();
  });

  it("renders copy buttons and QR containers for active options only", () => {
    render(<SupportCryptoDonations />);

    expect(screen.getAllByRole("button", { name: /copy address/i })).toHaveLength(
      ACTIVE_CRYPTO_DONATION_OPTIONS.length
    );

    for (const option of ACTIVE_CRYPTO_DONATION_OPTIONS) {
      expect(screen.getByTestId(`crypto-qr-${option.id}`)).toBeInTheDocument();
      expect(screen.getByText(option.address)).toBeInTheDocument();
    }
  });

  it("shows copied feedback after copying an address", async () => {
    render(<SupportCryptoDonations />);

    const copyButtons = screen.getAllByRole("button", { name: /copy address/i });
    fireEvent.click(copyButtons[0]!);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      ACTIVE_CRYPTO_DONATION_OPTIONS[0]!.address
    );
  });

  it("constrains QR containers for mobile readability", () => {
    render(<SupportCryptoDonations />);

    for (const option of ACTIVE_CRYPTO_DONATION_OPTIONS) {
      const qr = screen.getByTestId(`crypto-qr-${option.id}`);
      expect(qr.className).toMatch(/min\(100%,8\.75rem\)/);
    }
  });

  it("wraps long addresses safely on narrow viewports", () => {
    render(
      <div style={{ width: 320 }}>
        <SupportCryptoDonations />
      </div>
    );

    expect(screen.getByTestId("support-crypto-donations")).toHaveClass("min-w-0");
    const address = screen.getByText(ACTIVE_CRYPTO_DONATION_OPTIONS[0]!.address);
    expect(address.className).toMatch(/break-all/);
    expect(
      screen.getAllByRole("button", { name: /copy address/i })[0]
    ).toHaveClass("min-h-11");
  });
});
