import * as React from "react";
import { cn } from "@/lib/utils";

const thClass =
  "px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground";
const tdClass = "border-b border-border/60 px-4 py-2.5 text-[15px] text-muted-foreground";

/** HTML table wrapper for Storybook/docs MDX (markdown pipe tables render poorly in Storybook). */
export function DocTable({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("my-6 overflow-x-auto rounded-lg border border-border", className)}>
      <table className="w-full min-w-[20rem] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function DocTableHead({ children }: React.PropsWithChildren) {
  return <thead className="border-b border-border bg-muted/40">{children}</thead>;
}

export function DocTableBody({ children }: React.PropsWithChildren) {
  return <tbody>{children}</tbody>;
}

export function DocTableRow({ children }: React.PropsWithChildren) {
  return <tr>{children}</tr>;
}

export function DocTh({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th scope="col" className={cn(thClass, className)}>
      {children}
    </th>
  );
}

export function DocTd({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <td className={cn(tdClass, className)}>{children}</td>;
}
