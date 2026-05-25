import * as React from "react";
import { cn } from "@/lib/utils";

export type DocCalloutProps = {
  title?: string;
  children: React.ReactNode;
  variant?: "default" | "note";
  className?: string;
};

export function DocCallout({
  title,
  children,
  variant = "default",
  className,
}: DocCalloutProps) {
  return (
    <aside
      className={cn(
        "my-8 rounded-xl border px-4 py-3.5 text-[15px] leading-relaxed",
        variant === "note"
          ? "border-border/80 bg-muted/30 text-muted-foreground dark:bg-muted/20"
          : "border-border/70 bg-card text-muted-foreground shadow-sm",
        className
      )}
    >
      {title ? (
        <p className="mb-1.5 text-sm font-medium text-foreground">{title}</p>
      ) : null}
      <div className="[&>p:last-child]:mb-0 [&>p]:mb-2">{children}</div>
    </aside>
  );
}
