"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import {
  trackSupportCtaClick,
  type SupportCtaSource,
} from "@/lib/donation-telemetry";

type TrackedSupportLinkProps = ComponentProps<typeof Link> & {
  source: SupportCtaSource;
};

/** Support link with anonymous CTA click telemetry. */
export function TrackedSupportLink({
  source,
  onClick,
  ...props
}: TrackedSupportLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackSupportCtaClick(source);
        onClick?.(event);
      }}
    />
  );
}
