"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppSettingsSchema } from "@/db/schema";

type BoardOrientationValue = AppSettingsSchema["boardOrientation"];

const OPTIONS: { value: BoardOrientationValue; label: string }[] = [
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
];

export function BoardOrientationCard({
  value,
  onChange,
  disabled,
}: {
  value: BoardOrientationValue;
  onChange: (boardOrientation: BoardOrientationValue) => void;
  disabled?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium text-foreground">Board orientation</h3>
        <p className="text-xs text-muted-foreground">
          Which side the board is shown from in training and mistake review.
        </p>
      </CardHeader>
      <CardContent>
        <div
          role="radiogroup"
          aria-label="Board orientation"
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
