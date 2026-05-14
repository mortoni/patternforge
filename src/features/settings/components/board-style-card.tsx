"use client";

import type { CSSProperties, ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffectiveAppColorScheme } from "../hooks/use-effective-app-color-scheme";
import {
  BOARD_STYLE_IDS,
  BOARD_STYLE_MAP,
  getBoardStylePreviewCellStyles,
  parseBoardStyleId,
  type BoardStyleId,
} from "@/lib/chess/board-styles";

function MiniBoardPreview({
  light,
  dark,
}: {
  light: CSSProperties;
  dark: CSSProperties;
}) {
  const cells: ReactNode[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const isLight = (r + c) % 2 === 0;
      cells.push(
        <div
          key={`preview-${r * 4 + c}`}
          className="aspect-square"
          style={isLight ? light : dark}
        />
      );
    }
  }
  return (
    <div
      className="grid h-12 w-12 shrink-0 grid-cols-4 overflow-hidden rounded-sm border border-[var(--border)]"
      aria-hidden
    >
      {cells}
    </div>
  );
}

export function BoardStyleCard({
  value,
  onChange,
  disabled,
}: {
  value: BoardStyleId | undefined;
  onChange: (boardStyle: BoardStyleId) => void;
  disabled?: boolean;
}) {
  const scheme = useEffectiveAppColorScheme();
  const selected = parseBoardStyleId(value);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium text-foreground">Board style</h3>
        <p className="text-xs text-muted-foreground">
          Choose the chessboard appearance used across training and review.
        </p>
      </CardHeader>
      <CardContent>
        <div
          role="radiogroup"
          aria-label="Board style"
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {BOARD_STYLE_IDS.map((id) => {
            const def = BOARD_STYLE_MAP[id];
            const preview = getBoardStylePreviewCellStyles(def, scheme);
            const isSelected = selected === id;
            const ariaLabel = def.description
              ? `${def.label}. ${def.description}`
              : def.label;

            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-label={ariaLabel}
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => onChange(id)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  "border-border bg-card hover:bg-muted/30",
                  isSelected &&
                    "border-[var(--primary)] bg-[var(--primary)]/8 ring-1 ring-[var(--primary)]/40"
                )}
              >
                <MiniBoardPreview light={preview.light} dark={preview.dark} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {def.label}
                  </span>
                  {def.description ? (
                    <span className="text-xs leading-snug text-muted-foreground">
                      {def.description}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
