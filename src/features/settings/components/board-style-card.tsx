"use client";

import type { CSSProperties, ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BOARD_STYLE_IDS,
  BOARD_STYLE_MAP,
  getBoardStylePreviewCellStyles,
  parseBoardStyleId,
  type BoardStyleDefinition,
  type BoardStyleId,
} from "@/lib/chess/board-styles";

/**
 * Both color-scheme variants of a preview cell as CSS custom properties.
 * The inline style is identical on server and client (no theme read in JS);
 * the `dark:` utilities on the cell pick the variant via `html.dark`, which
 * the theme bootstrap script sets before hydration. Reading the theme in JS
 * here previously caused a hydration mismatch (server rendered light-mode
 * colors, client rendered dark-mode ones).
 */
function previewCellVars(
  lightScheme: CSSProperties,
  darkScheme: CSSProperties
): CSSProperties {
  return {
    "--pv-bg": lightScheme.backgroundColor ?? "transparent",
    "--pv-bg-image": lightScheme.backgroundImage ?? "none",
    "--pv-bg-dark": darkScheme.backgroundColor ?? "transparent",
    "--pv-bg-image-dark": darkScheme.backgroundImage ?? "none",
  } as CSSProperties;
}

const PREVIEW_CELL_CLASS =
  "aspect-square bg-[var(--pv-bg)] [background-image:var(--pv-bg-image)] dark:bg-[var(--pv-bg-dark)] dark:[background-image:var(--pv-bg-image-dark)]";

function MiniBoardPreview({ def }: { def: BoardStyleDefinition }) {
  const inLightMode = getBoardStylePreviewCellStyles(def, "light");
  const inDarkMode = getBoardStylePreviewCellStyles(def, "dark");
  const lightSquare = previewCellVars(inLightMode.light, inDarkMode.light);
  const darkSquare = previewCellVars(inLightMode.dark, inDarkMode.dark);

  const cells: ReactNode[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const isLight = (r + c) % 2 === 0;
      cells.push(
        <div
          key={`preview-${r * 4 + c}`}
          className={PREVIEW_CELL_CLASS}
          style={isLight ? lightSquare : darkSquare}
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
                <MiniBoardPreview def={def} />
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
