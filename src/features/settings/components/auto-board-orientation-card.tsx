"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import * as Checkbox from "@radix-ui/react-checkbox";
import type { AppSettingsSchema } from "@/db/schema";
import { Check } from "lucide-react";

type AutoBoardOrientationValue = AppSettingsSchema["autoBoardOrientation"];

export function AutorBoardOrientationCard({
  value,
  onChange,
  disabled,
}: {
  value: AutoBoardOrientationValue;
  onChange: (autoBoardOrientation: AutoBoardOrientationValue) => void;
  disabled?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium text-foreground">Auto flip board</h3>
        <p className="text-xs text-muted-foreground">
          Automatically flips the board with side to move on the bottom in training and
          mistake review.
        </p>
      </CardHeader>
      <CardContent>
        <label
          htmlFor="terms"
          style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
        >
          <Checkbox.Root
            id="terms"
            checked={value}
            onCheckedChange={onChange}
            disabled={disabled}
            style={{
              width: 20,
              height: 20,
              border: "2px solid #6366f1",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "white",
              cursor: "pointer",
            }}
          >
            <Checkbox.Indicator style={{ color: "#6366f1" }}>
              <Check size={14} strokeWidth={3} />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <span style={{ fontSize: 14 }}>Auto select board orientation</span>
        </label>
      </CardContent>
    </Card>
  );
}
