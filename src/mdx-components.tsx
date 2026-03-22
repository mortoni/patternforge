import * as React from "react";
import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function DocsAnchor({
  className,
  href,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"a">) {
  const h = href ?? "";
  const shared =
    "font-medium text-foreground underline decoration-border/80 underline-offset-[5px] transition-colors hover:decoration-foreground";

  if (h.startsWith("/")) {
    return (
      <Link href={h} className={cn(shared, className)} {...props}>
        {children}
      </Link>
    );
  }

  if (h.startsWith("#")) {
    return (
      <a href={h} className={cn(shared, className)} {...props}>
        {children}
      </a>
    );
  }

  return (
    <a
      href={h}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(shared, className)}
      {...props}
    >
      {children}
    </a>
  );
}

function MDXCode({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"code">) {
  const isBlock = /language-/.test(className ?? "");
  if (isBlock) {
    return (
      <code
        className={cn(
          "block w-fit min-w-full bg-transparent p-0 font-mono text-[13px] leading-relaxed text-foreground",
          className
        )}
        {...props}
      />
    );
  }
  return (
    <code
      className={cn(
        "rounded-md border border-border/60 bg-muted/80 px-1.5 py-0.5 font-mono text-[0.8125rem] font-normal text-foreground dark:bg-muted/50",
        className
      )}
      {...props}
    />
  );
}

function MDXPre({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"pre">) {
  return (
    <pre
      className={cn(
        "my-8 overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 shadow-sm dark:bg-muted/25",
        "[&_code]:text-[13px] [&_code]:leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </pre>
  );
}

export function useMDXComponents(
  components: Record<string, unknown>
): Record<string, unknown> {
  return {
    h1: ({ className, ...props }: ComponentPropsWithoutRef<"h1">) => (
      <h1
        className={cn(
          "mb-3 mt-0 text-balance text-3xl font-light tracking-tight text-foreground md:text-[2rem] md:leading-tight",
          className
        )}
        {...props}
      />
    ),
    h2: ({ className, ...props }: ComponentPropsWithoutRef<"h2">) => (
      <h2
        className={cn(
          "mb-4 mt-12 border-b border-border/70 pb-3 text-2xl font-medium tracking-tight text-foreground first:mt-0",
          className
        )}
        {...props}
      />
    ),
    h3: ({ className, ...props }: ComponentPropsWithoutRef<"h3">) => (
      <h3
        className={cn(
          "mb-3 mt-10 text-lg font-medium tracking-tight text-foreground",
          className
        )}
        {...props}
      />
    ),
    h4: ({ className, ...props }: ComponentPropsWithoutRef<"h4">) => (
      <h4
        className={cn(
          "mb-2 mt-8 text-base font-semibold tracking-tight text-foreground",
          className
        )}
        {...props}
      />
    ),
    p: ({ className, ...props }: ComponentPropsWithoutRef<"p">) => (
      <p
        className={cn(
          "mb-5 text-[15px] leading-[1.7] text-muted-foreground last:mb-0",
          className
        )}
        {...props}
      />
    ),
    ul: ({ className, ...props }: ComponentPropsWithoutRef<"ul">) => (
      <ul
        className={cn(
          "mb-6 list-disc space-y-2.5 pl-6 text-[15px] leading-[1.65] text-muted-foreground marker:text-muted-foreground/45",
          "[&_ul]:mt-2 [&_ul]:mb-2",
          className
        )}
        {...props}
      />
    ),
    ol: ({ className, ...props }: ComponentPropsWithoutRef<"ol">) => (
      <ol
        className={cn(
          "mb-6 list-decimal space-y-2.5 pl-6 text-[15px] leading-[1.65] text-muted-foreground marker:text-muted-foreground/55",
          "[&_ol]:mt-2 [&_ol]:mb-2",
          className
        )}
        {...props}
      />
    ),
    li: ({ className, children, ...props }: ComponentPropsWithoutRef<"li">) => (
      <li
        className={cn(
          "text-[15px] leading-[1.65] text-muted-foreground [&>p]:mb-2 [&>p]:last:mb-0",
          className
        )}
        {...props}
      >
        {children}
      </li>
    ),
    strong: ({ className, ...props }: ComponentPropsWithoutRef<"strong">) => (
      <strong
        className={cn("font-semibold text-foreground", className)}
        {...props}
      />
    ),
    blockquote: ({
      className,
      ...props
    }: ComponentPropsWithoutRef<"blockquote">) => (
      <blockquote
        className={cn(
          "my-8 border-l-2 border-foreground/15 py-1 pl-5 text-[15px] italic leading-relaxed text-muted-foreground dark:border-foreground/25",
          className
        )}
        {...props}
      />
    ),
    hr: ({ className, ...props }: ComponentPropsWithoutRef<"hr">) => (
      <hr className={cn("my-10 border-border", className)} {...props} />
    ),
    img: ({ className, alt, ...props }: ComponentPropsWithoutRef<"img">) => (
      // MDX diagrams: prefer static assets; Next/Image needs known dimensions/hosts.
      // eslint-disable-next-line @next/next/no-img-element -- docs content may use arbitrary URLs
      <img
        className={cn(
          "my-8 h-auto max-w-full rounded-xl border border-border/80 shadow-sm",
          className
        )}
        alt={alt ?? ""}
        {...props}
      />
    ),
    a: DocsAnchor,
    code: MDXCode,
    pre: MDXPre,
    /*
     * Tables: match `src/components/ui/table.tsx` (shadcn) — bordered shell, row dividers,
     * generous cell padding. Prose tweaks: td align-top + line-height for multi-line cells.
     */
    table: ({ className, ...props }: ComponentPropsWithoutRef<"table">) => (
      <div className="my-8 rounded-md border border-border bg-card text-card-foreground shadow-sm">
        <div className="relative w-full overflow-x-auto">
          <table
            className={cn("w-full caption-bottom text-sm", className)}
            {...props}
          />
        </div>
      </div>
    ),
    thead: ({ className, ...props }: ComponentPropsWithoutRef<"thead">) => (
      <thead
        className={cn("bg-muted/50 [&_tr]:border-b", className)}
        {...props}
      />
    ),
    tbody: ({ className, ...props }: ComponentPropsWithoutRef<"tbody">) => (
      <tbody
        className={cn("[&_tr:last-child]:border-0", className)}
        {...props}
      />
    ),
    tr: ({ className, ...props }: ComponentPropsWithoutRef<"tr">) => (
      <tr
        className={cn(
          "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
          className
        )}
        {...props}
      />
    ),
    th: ({ className, ...props }: ComponentPropsWithoutRef<"th">) => (
      <th
        className={cn(
          "h-10 px-4 text-left align-middle text-sm font-medium text-muted-foreground",
          className
        )}
        {...props}
      />
    ),
    td: ({ className, ...props }: ComponentPropsWithoutRef<"td">) => (
      <td
        className={cn(
          "p-4 align-top text-[15px] leading-relaxed text-muted-foreground",
          "[&_strong]:font-semibold [&_strong]:text-foreground",
          className
        )}
        {...props}
      />
    ),
    ...components,
  };
}
