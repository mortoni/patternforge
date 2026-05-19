"use client";

import * as React from "react";
import {
  trackStripeSuccessReturn,
  trackSupportPageView,
} from "@/lib/donation-telemetry";

type DonationPageTelemetryProps = {
  variant: "support_page" | "stripe_success";
};

/** Fires donation page-view events once per browser session. */
export function DonationPageTelemetry({ variant }: DonationPageTelemetryProps) {
  React.useEffect(() => {
    if (variant === "support_page") {
      trackSupportPageView();
    } else {
      trackStripeSuccessReturn();
    }
  }, [variant]);

  return null;
}
