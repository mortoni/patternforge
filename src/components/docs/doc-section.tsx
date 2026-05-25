import * as React from "react";
import { cn } from "@/lib/utils";

export type DocSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function DocSection({ title, description, children, className }: DocSectionProps) {
  return (
    <section className={cn("mt-14 first:mt-0", className)}>
      <h2 className="mb-2 border-b border-border/70 pb-2.5 text-xl font-medium tracking-tight text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mb-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children}
    </section>
  );
}
