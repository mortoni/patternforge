import { describe, it, expect } from "vitest";
import {
  ACTIVE_CRYPTO_DONATION_OPTIONS,
  CRYPTO_DONATION_OPTIONS,
  CRYPTO_NETWORK_WARNING,
  CRYPTO_PRIVACY_NOTE,
  cryptoDonationQrValue,
  isConfiguredCryptoDonationAddress,
} from "./crypto-donation-options";

describe("crypto-donation-options", () => {
  it("includes all supported crypto assets", () => {
    expect(CRYPTO_DONATION_OPTIONS.map((option) => option.id)).toEqual([
      "btc",
      "lightning",
      "eth",
      "sol",
      "usdtErc20",
      "usdtTrc20",
    ]);
  });

  it("distinguishes USDT network variants", () => {
    const usdtErc20 = CRYPTO_DONATION_OPTIONS.find((o) => o.id === "usdtErc20");
    const usdtTrc20 = CRYPTO_DONATION_OPTIONS.find((o) => o.id === "usdtTrc20");

    expect(usdtErc20?.networkLabel).toBe("ERC20");
    expect(usdtErc20?.network).toBe("Ethereum");
    expect(usdtTrc20?.networkLabel).toBe("TRC20");
    expect(usdtTrc20?.network).toBe("TRON");
  });

  it("exposes warning and privacy copy", () => {
    expect(CRYPTO_NETWORK_WARNING).toMatch(/wrong network/i);
    expect(CRYPTO_PRIVACY_NOTE).toMatch(/does not require an account/i);
  });

  it("uses configured BTC and Lightning addresses", () => {
    const btc = CRYPTO_DONATION_OPTIONS.find((o) => o.id === "btc");
    const lightning = CRYPTO_DONATION_OPTIONS.find((o) => o.id === "lightning");

    expect(btc?.address).toBe(
      "bc1pk6s6a5lf6qvsz8wn84hn4hx579lshk7a6lp0py0etqyzt7h4p0hsg42x9q"
    );
    expect(lightning?.address).toBe("warycoyote439@walletofsatoshi.com");
    expect(cryptoDonationQrValue(lightning!)).toBe(
      "lightning:warycoyote439@walletofsatoshi.com"
    );
  });

  it("filters out placeholder addresses from active options", () => {
    expect(isConfiguredCryptoDonationAddress("TODO_ADD_ETH_ADDRESS")).toBe(
      false
    );
    expect(
      isConfiguredCryptoDonationAddress(
        "bc1pk6s6a5lf6qvsz8wn84hn4hx579lshk7a6lp0py0etqyzt7h4p0hsg42x9q"
      )
    ).toBe(true);

    expect(ACTIVE_CRYPTO_DONATION_OPTIONS.map((option) => option.id)).toEqual([
      "btc",
      "lightning",
    ]);
  });
});
