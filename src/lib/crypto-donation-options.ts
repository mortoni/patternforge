/**
 * Static crypto donation addresses for the /support page.
 *
 * PatternForge does not connect wallets or track on-chain payments—donors send
 * funds directly. Update addresses here or via `NEXT_PUBLIC_CRYPTO_DONATION_*`
 * env vars (see README).
 */

export type CryptoDonationId =
  | "btc"
  | "lightning"
  | "eth"
  | "sol"
  | "usdtErc20"
  | "usdtTrc20";

export type CryptoDonationOption = {
  id: CryptoDonationId;
  name: string;
  symbol: string;
  network: string;
  address: string;
  /** Short label to distinguish similar assets (e.g. USDT variants). */
  networkLabel?: string;
};

const PLACEHOLDER_ADDRESSES: Record<CryptoDonationId, string> = {
  btc: "bc1pk6s6a5lf6qvsz8wn84hn4hx579lshk7a6lp0py0etqyzt7h4p0hsg42x9q",
  lightning: "warycoyote439@walletofsatoshi.com",
  eth: "TODO_ADD_ETH_ADDRESS",
  sol: "TODO_ADD_SOL_ADDRESS",
  usdtErc20: "TODO_ADD_USDT_ERC20_ADDRESS",
  usdtTrc20: "TODO_ADD_USDT_TRC20_ADDRESS",
};

function resolveCryptoAddress(
  envKey: string,
  id: CryptoDonationId
): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env[envKey]?.trim()
      : undefined;
  return fromEnv || PLACEHOLDER_ADDRESSES[id];
}

export const CRYPTO_DONATION_OPTIONS: readonly CryptoDonationOption[] = [
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    network: "Bitcoin",
    address: resolveCryptoAddress("NEXT_PUBLIC_CRYPTO_DONATION_BTC", "btc"),
  },
  {
    id: "lightning",
    name: "Lightning",
    symbol: "BTC",
    network: "Lightning Network",
    address: resolveCryptoAddress(
      "NEXT_PUBLIC_CRYPTO_DONATION_LIGHTNING",
      "lightning"
    ),
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    network: "Ethereum",
    address: resolveCryptoAddress("NEXT_PUBLIC_CRYPTO_DONATION_ETH", "eth"),
  },
  {
    id: "sol",
    name: "Solana",
    symbol: "SOL",
    network: "Solana",
    address: resolveCryptoAddress("NEXT_PUBLIC_CRYPTO_DONATION_SOL", "sol"),
  },
  {
    id: "usdtErc20",
    name: "Tether",
    symbol: "USDT",
    network: "Ethereum",
    networkLabel: "ERC20",
    address: resolveCryptoAddress(
      "NEXT_PUBLIC_CRYPTO_DONATION_USDT_ERC20",
      "usdtErc20"
    ),
  },
  {
    id: "usdtTrc20",
    name: "Tether",
    symbol: "USDT",
    network: "TRON",
    networkLabel: "TRC20",
    address: resolveCryptoAddress(
      "NEXT_PUBLIC_CRYPTO_DONATION_USDT_TRC20",
      "usdtTrc20"
    ),
  },
] as const;

const TODO_ADDRESS_PATTERN = /^TODO_ADD_/i;

/** True when an address is set and not a config placeholder. */
export function isConfiguredCryptoDonationAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed.length > 0 && !TODO_ADDRESS_PATTERN.test(trimmed);
}

/** Options with real addresses — used by the /support UI. */
export const ACTIVE_CRYPTO_DONATION_OPTIONS = CRYPTO_DONATION_OPTIONS.filter(
  (option) => isConfiguredCryptoDonationAddress(option.address)
);

export const CRYPTO_NETWORK_WARNING =
  "Please send funds only on the selected network. Transactions sent to the wrong network may be lost.";

export const CRYPTO_PRIVACY_NOTE =
  "Crypto donations are processed directly through the wallet network. PatternForge does not require an account to donate.";

/** Value encoded in QR codes (Lightning addresses use the `lightning:` URI scheme). */
export function cryptoDonationQrValue(option: CryptoDonationOption): string {
  if (
    option.id === "lightning" &&
    option.address.includes("@") &&
    !option.address.startsWith("lightning:")
  ) {
    return `lightning:${option.address}`;
  }
  return option.address;
}
