"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  description?: string;
}

function StatCard({
  label,
  value,
  description,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card className={cn(className)} {...props}>
      <CardHeader className="pb-1">
        <p className="text-xs font-medium text-[var(--muted-foreground)]">
          {label}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {description && (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { StatCard };
