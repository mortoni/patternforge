"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppSettingsSchema } from "@/db/schema";

type ThemeValue = AppSettingsSchema["theme"];

const OPTIONS: { value: ThemeValue; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeSettingCard({
  value,
  onChange,
  disabled,
}: {
  value: ThemeValue;
  onChange: (theme: ThemeValue) => void;
  disabled?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium text-foreground">Theme</h3>
        <p className="text-xs text-muted-foreground">
          Choose light, dark, or follow your system preference.
        </p>
      </CardHeader>
      <CardContent>
        <div
          role="radiogroup"
          aria-label="Theme"
          className="flex flex-wrap gap-2"
        >
          {OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant="outline"
              size="sm"
              role="radio"
              aria-checked={value === opt.value}
              disabled={disabled}
              className={cn(
                "min-w-[5rem]",
                value === opt.value &&
                  "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
              )}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
