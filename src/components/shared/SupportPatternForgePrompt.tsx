"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { trackSupportCtaClick } from "@/lib/donation-telemetry";
import {
  canShowSupportPrompt,
  dismissSupportPrompt,
  markUserAsSupported,
  recordSupportPromptShown,
} from "@/lib/support-prompt-storage";
import { meetsSupportPromptMilestone } from "@/services/support-prompt-eligibility.service";
import { cn } from "@/lib/utils";
import type { SupportCtaSource } from "@/lib/donation-telemetry";

type SupportPatternForgePromptProps = {
  className?: string;
  source: SupportCtaSource;
};

/**
 * Calm, inline support prompt for reflection / cycle-completion flows only.
 * Never mount on training or board screens.
 */
export function SupportPatternForgePrompt({
  className,
  source,
}: SupportPatternForgePromptProps) {
  const [visible, setVisible] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function evaluate() {
      if (!canShowSupportPrompt()) {
        if (!cancelled) {
          setVisible(false);
          setReady(true);
        }
        return;
      }

      const eligible = await meetsSupportPromptMilestone();
      if (!cancelled) {
        if (eligible) {
          recordSupportPromptShown();
        }
        setVisible(eligible);
        setReady(true);
      }
    }

    void evaluate();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = React.useCallback(() => {
    dismissSupportPrompt();
    setVisible(false);
  }, []);

  const handleSupportClick = React.useCallback(() => {
    trackSupportCtaClick(source);
    markUserAsSupported();
    setVisible(false);
  }, [source]);

  if (!ready || !visible) {
    return null;
  }

  return (
    <Card
      className={cn(
        "border-border/60 bg-muted/5 shadow-none",
        className
      )}
      data-testid="support-patternforge-prompt"
    >
      <CardHeader className="space-y-1.5 pb-3 pt-5">
        <CardTitle className="text-base font-medium text-foreground">
          Support PatternForge
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          PatternForge is free and independently maintained. Optional support
          helps keep training accessible for everyone.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-5 pb-5 pt-0 sm:flex-row sm:flex-wrap">
        <Button asChild size="sm" className="min-h-10 w-full sm:w-auto">
          <Link href={ROUTES.support} onClick={handleSupportClick}>
            Support the project
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-10 w-full text-muted-foreground sm:w-auto"
          onClick={handleDismiss}
        >
          Maybe later
        </Button>
      </CardContent>
    </Card>
  );
}
