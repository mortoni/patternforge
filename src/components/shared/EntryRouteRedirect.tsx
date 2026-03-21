"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { resolveAppEntryRoute } from "@/services/entry-routing.service";
import { ROUTES } from "@/lib/constants";
import Logo from "@/components/logo/Logo";
import AppTitle from "@/components/logo/AppTitle";
import { Button } from "@/components/ui/button";

export interface EntryRouteRedirectProps {
  /**
   * When true (e.g. `/app`), send the user to training or sets immediately.
   * When false (e.g. `/`), show the logo and require Continue — "/" stays usable.
   */
  autoRedirect?: boolean;
}

export function EntryRouteRedirect({ autoRedirect = true }: EntryRouteRedirectProps) {
  const router = useRouter();
  const [navigating, setNavigating] = React.useState(false);

  React.useEffect(() => {
    if (!autoRedirect) return;

    let cancelled = false;

    void resolveAppEntryRoute()
      .then((route) => {
        if (!cancelled) router.replace(route);
      })
      .catch(() => {
        if (!cancelled) router.replace(ROUTES.sets);
      });

    return () => {
      cancelled = true;
    };
  }, [router, autoRedirect]);

  const handleContinue = React.useCallback(async () => {
    setNavigating(true);
    try {
      const route = await resolveAppEntryRoute();
      router.push(route);
    } catch {
      router.push(ROUTES.sets);
    } finally {
      setNavigating(false);
    }
  }, [router]);

  if (autoRedirect) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <AppTitle />
        </div>
        <p className="text-sm text-muted-foreground">Opening your training flow…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-3">
        <Logo />
        <AppTitle />
      </div>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        Resume an active cycle or open your training sets — your choice.
      </p>
      <Button type="button" size="lg" disabled={navigating} onClick={() => void handleContinue()}>
        {navigating ? "Loading…" : "Continue"}
      </Button>
    </div>
  );
}
