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

const isSelected = (
  value: BoardOrientationValue,
  optValue: BoardOrientationValue,
  isAutoBoardOrientation: boolean
) => {
  return Boolean(value === optValue && !isAutoBoardOrientation);
};

export function BoardOrientationCard({
  value,
  isAutoBoardOrientation = false,
  onChange,
  onChangeAutoBoardOrientation,
  disabled,
}: {
  value: BoardOrientationValue;
  isAutoBoardOrientation: boolean;
  onChange: (boardOrientation: BoardOrientationValue) => void;
  onChangeAutoBoardOrientation: (autoBoardOrientation: boolean) => void;
  disabled?: boolean;
}) {
  const handleChange = (option: BoardOrientationValue) => {
    onChangeAutoBoardOrientation(false);
    onChange(option);
  };
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
              aria-checked={isSelected(value, opt.value, isAutoBoardOrientation)}
              disabled={disabled}
              className={cn(
                "min-w-[5rem]",
                isSelected(value, opt.value, isAutoBoardOrientation) &&
                  "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
              )}
              onClick={() => {
                handleChange(opt.value);
              }}
            >
              {opt.label}
            </Button>
          ))}
          <Button
            key="auto-side"
            type="button"
            variant="outline"
            size="sm"
            role="radio"
            aria-checked={isAutoBoardOrientation}
            disabled={disabled}
            className={cn(
              "min-w-[5rem]",
              isAutoBoardOrientation &&
                "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
            )}
            onClick={() => onChangeAutoBoardOrientation(!isAutoBoardOrientation)}
          >
            Side to move
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
