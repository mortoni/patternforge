"use client";

import * as React from "react";
import { CreditCard } from "lucide-react";
import {
  stripeTierToTelemetryAmount,
  trackStripeCheckoutOpen,
} from "@/lib/donation-telemetry";
import {
  supportDonationCardClass,
  supportDonationGridClass,
} from "@/components/marketing/support-layout-classes";
import { STRIPE_DONATION_OPTIONS } from "@/lib/stripe-donation-links";
import { cn } from "@/lib/utils";

export function SupportDonationOptions() {
  const pendingRef = React.useRef<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const beginCheckout = React.useCallback(
    (optionId: (typeof STRIPE_DONATION_OPTIONS)[number]["id"]) => {
      if (pendingRef.current != null) return false;
      pendingRef.current = optionId;
      setPendingId(optionId);
      trackStripeCheckoutOpen({
        amount: stripeTierToTelemetryAmount(optionId),
      });
      return true;
    },
    []
  );

  return (
    <div
      className={supportDonationGridClass}
      data-testid="support-donation-options"
    >
      {STRIPE_DONATION_OPTIONS.map((option) => {
        const isPending = pendingId === option.id;
        return (
          <a
            key={option.id}
            href={option.href}
            className={cn(
              supportDonationCardClass,
              "no-underline",
              isPending && "pointer-events-none opacity-70"
            )}
            aria-label={`Donate ${option.amountLabel} via Stripe`}
            aria-busy={isPending}
            data-testid={`stripe-donation-${option.id}`}
            onClick={(event) => {
              if (pendingRef.current != null) {
                event.preventDefault();
                return;
              }
              beginCheckout(option.id);
            }}
          >
            <div>
              <p className="text-lg font-medium tracking-tight text-foreground">
                {option.amountLabel}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {option.helperText}
              </p>
            </div>
            <span className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground group-active:text-foreground">
              <CreditCard className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {isPending ? "Opening Stripe…" : "Continue to Stripe"}
            </span>
          </a>
        );
      })}
    </div>
  );
}
