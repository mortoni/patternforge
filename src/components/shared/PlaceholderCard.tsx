"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface PlaceholderCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

function PlaceholderCard({
  title = "Placeholder",
  description = "Content will be implemented here.",
  className,
  children,
  ...props
}: PlaceholderCardProps) {
  return (
    <Card className={cn("opacity-90", className)} {...props}>
      <CardHeader>
        <h3 className="text-sm font-medium text-[var(--muted-foreground)]">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-[var(--muted-foreground)]/80">
            {description}
          </p>
        )}
      </CardHeader>
      {children ? (
        <CardContent>{children}</CardContent>
      ) : (
        <CardContent>
          <div className="h-24 rounded border border-dashed border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-center text-xs text-[var(--muted-foreground)]">
            Placeholder content
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export { PlaceholderCard };
