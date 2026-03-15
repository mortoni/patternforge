import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

function PageHeader({
  title,
  description,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn("mb-6 space-y-1", className)}
      {...props}
    >
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
      )}
      {children}
    </div>
  );
}

export { PageHeader };
