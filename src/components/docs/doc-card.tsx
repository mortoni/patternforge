import * as React from "react";
import { cn } from "@/lib/utils";
import { StorybookDocLink } from "@/lib/storybook-doc-link";

export type DocCardProps = {
  href: string;
  title: string;
  description: string;
  className?: string;
};

/**
 * Navigation card for the docs introduction. Uses a stretched link so title/description
 * keep normal text styling (not global Storybook anchor styles).
 */
export function DocCard({ href, title, description, className }: DocCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-colors",
        "hover:border-border hover:bg-muted/20",
        className
      )}
    >
      <p className="pointer-events-none text-[15px] font-medium text-foreground transition-colors group-hover:underline group-hover:decoration-border/80 group-hover:underline-offset-4">
        {title}
      </p>
      <p className="pointer-events-none mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <StorybookDocLink
        href={href}
        aria-label={title}
        className="absolute inset-0 z-10 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
      >
        <span className="sr-only">{title}</span>
      </StorybookDocLink>
    </div>
  );
}

export function DocGrid({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "my-6 grid gap-3 sm:grid-cols-2 [&:first-child]:mt-0",
        className
      )}
    >
      {children}
    </div>
  );
}
