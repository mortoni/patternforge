import * as React from "react";
import { cn } from "@/lib/utils";

interface LandingSectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  /** Optional id for anchor links (e.g. #how-it-works) */
  id?: string;
  /** Tighter max-width for long-form copy (better line length) */
  narrow?: boolean;
}

function LandingSection({
  children,
  id,
  narrow = false,
  className,
  ...props
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 md:py-24",
        narrow && "mx-auto max-w-2xl w-full",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

function LandingSectionHeading({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-xl font-semibold tracking-tight text-[var(--foreground)] md:text-2xl",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

function LandingSectionBody({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-4 text-[var(--muted-foreground)] leading-relaxed [&_p]:mt-3 [&_p:first-child]:mt-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function LandingList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2 text-[var(--muted-foreground)]">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--muted-foreground)]/60" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export {
  LandingSection,
  LandingSectionHeading,
  LandingSectionBody,
  LandingList,
};
