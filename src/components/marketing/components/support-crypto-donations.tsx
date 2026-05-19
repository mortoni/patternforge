"use client";

import * as React from "react";
import QRCode from "react-qr-code";
import { Copy, Check, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cryptoAddressBoxClass,
  cryptoAddressTextClass,
  cryptoDonationCardClass,
  cryptoQrContainerClass,
  cryptoQrFrameClass,
  supportTouchTargetClass,
} from "@/components/marketing/support-layout-classes";
import {
  ACTIVE_CRYPTO_DONATION_OPTIONS,
  CRYPTO_NETWORK_WARNING,
  CRYPTO_PRIVACY_NOTE,
  cryptoDonationQrValue,
  type CryptoDonationOption,
} from "@/lib/crypto-donation-options";
import { cn } from "@/lib/utils";

const body = "text-[15px] leading-relaxed text-muted-foreground";

function networkAccentClass(id: CryptoDonationOption["id"]) {
  if (id === "usdtErc20") {
    return "border-l-[3px] border-l-sky-500/45";
  }
  if (id === "usdtTrc20") {
    return "border-l-[3px] border-l-rose-500/45";
  }
  return "";
}

function CryptoDonationCard({
  option,
  copied,
  onCopy,
}: {
  option: CryptoDonationOption;
  copied: boolean;
  onCopy: () => void;
}) {
  const titleId = `crypto-${option.id}-title`;
  const addressId = `crypto-${option.id}-address`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(cryptoDonationCardClass, networkAccentClass(option.id))}
      data-testid={`crypto-donation-card-${option.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h4 id={titleId} className="text-base font-medium tracking-tight">
          {option.name}
        </h4>
        <span className="rounded-md border border-border/70 bg-muted/35 px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {option.symbol}
        </span>
        {option.networkLabel ? (
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 font-mono text-xs",
              option.id === "usdtErc20" &&
                "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
              option.id === "usdtTrc20" &&
                "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
            )}
          >
            {option.networkLabel}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{option.network}</p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div
          className={cryptoQrContainerClass}
          aria-label={`QR code for ${option.name} on ${option.network}`}
          data-testid={`crypto-qr-${option.id}`}
        >
          <div className={cryptoQrFrameClass}>
            <QRCode
              value={cryptoDonationQrValue(option)}
              size={256}
              className="h-auto w-full max-w-full"
              aria-hidden
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className={cryptoAddressBoxClass}>
            <p
              id={addressId}
              className={cryptoAddressTextClass}
              title={option.address}
            >
              {option.address}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("mt-3 w-full sm:w-auto", supportTouchTargetClass)}
            onClick={onCopy}
            aria-describedby={addressId}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden />
                Copy address
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function SupportCryptoDonations() {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = React.useCallback(async (id: string, address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    } catch {
      setCopiedId(null);
    }
  }, []);

  if (ACTIVE_CRYPTO_DONATION_OPTIONS.length === 0) {
    return null;
  }

  return (
    <div
      className="mt-12 min-w-0"
      aria-labelledby="crypto-support-heading"
      data-testid="support-crypto-donations"
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/35 text-muted-foreground">
          <Wallet className="h-4 w-4" aria-hidden />
        </span>
        <h3
          id="crypto-support-heading"
          className="text-base font-medium tracking-tight text-foreground"
        >
          Crypto support
        </h3>
      </div>
      <p className={`mt-3 max-w-2xl text-pretty ${body}`}>
        Send a direct transfer to one of the addresses below.
      </p>

      <p
        className="mt-4 max-w-2xl rounded-md border border-amber-500/25 bg-amber-500/5 px-3.5 py-3 text-sm leading-relaxed text-muted-foreground"
        role="note"
      >
        {CRYPTO_NETWORK_WARNING}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4">
        {ACTIVE_CRYPTO_DONATION_OPTIONS.map((option) => (
          <CryptoDonationCard
            key={option.id}
            option={option}
            copied={copiedId === option.id}
            onCopy={() => void handleCopy(option.id, option.address)}
          />
        ))}
      </div>

      <p className={`mt-6 max-w-2xl text-pretty ${body}`}>{CRYPTO_PRIVACY_NOTE}</p>
    </div>
  );
}
