"use client";

import { cn } from "@/lib/utils";

type ProductImagePlaceholderVariant = "phone" | "desktop" | "wide" | "card";

const variantClassMap: Record<ProductImagePlaceholderVariant, string> = {
  phone: "aspect-[9/19] w-full max-w-[18rem]",
  desktop: "aspect-[16/10] w-full",
  wide: "aspect-[21/8] w-full",
  card: "aspect-[16/11] w-full",
};

interface ProductImagePlaceholderProps {
  label: string;
  description?: string;
  variant?: ProductImagePlaceholderVariant;
  className?: string;
}

export function ProductImagePlaceholder({
  label,
  description,
  variant = "desktop",
  className,
}: ProductImagePlaceholderProps) {
  return (
    <div
      aria-label={`Placeholder image: ${label}${description ? `. ${description}` : ""}`}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),rgba(255,255,255,0.02)_35%,rgba(0,0,0,0.08)_100%)]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        variantClassMap[variant],
        className
      )}
    >
      <div className="absolute inset-x-3 top-3 h-6 rounded-md border border-border/60 bg-background/30" />
      <div className="absolute left-3 right-3 top-12 space-y-2">
        <div className="h-2.5 w-2/3 rounded bg-foreground/10" />
        <div className="h-2.5 w-1/2 rounded bg-foreground/10" />
      </div>
      <div className="absolute inset-x-3 bottom-3 grid grid-cols-3 gap-2">
        <div className="h-7 rounded bg-foreground/8" />
        <div className="h-7 rounded bg-foreground/8" />
        <div className="h-7 rounded bg-foreground/8" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_62%,rgba(255,255,255,0.04)_100%)]" />

      <div className="absolute left-3 top-3 z-10 rounded-full border border-border/70 bg-background/85 px-2.5 py-1 text-[10px] font-medium tracking-wide text-foreground/90 uppercase">
        {label}
      </div>
      {description ? (
        <p className="absolute bottom-3 left-3 right-3 z-10 text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
