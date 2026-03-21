import type { MDXComponents } from "mdx/types";
import * as React from "react";
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

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ className, ...props }) => (
      <h1
        className={cn(
          "mb-3 mt-0 text-balance text-3xl font-light tracking-tight text-foreground md:text-[2rem] md:leading-tight",
          className
        )}
        {...props}
      />
    ),
    h2: ({ className, ...props }) => (
      <h2
        className={cn(
          "mb-4 mt-12 border-b border-border/70 pb-3 text-2xl font-medium tracking-tight text-foreground first:mt-0",
          className
        )}
        {...props}
      />
    ),
    h3: ({ className, ...props }) => (
      <h3
        className={cn(
          "mb-3 mt-10 text-lg font-medium tracking-tight text-foreground",
          className
        )}
        {...props}
      />
    ),
    h4: ({ className, ...props }) => (
      <h4
        className={cn(
          "mb-2 mt-8 text-base font-semibold tracking-tight text-foreground",
          className
        )}
        {...props}
      />
    ),
    p: ({ className, ...props }) => (
      <p
        className={cn(
          "mb-5 text-[15px] leading-[1.7] text-muted-foreground last:mb-0",
          className
        )}
        {...props}
      />
    ),
    ul: ({ className, ...props }) => (
      <ul
        className={cn(
          "mb-6 list-disc space-y-2.5 pl-6 text-[15px] leading-[1.65] text-muted-foreground marker:text-muted-foreground/45",
          "[&_ul]:mt-2 [&_ul]:mb-2",
          className
        )}
        {...props}
      />
    ),
    ol: ({ className, ...props }) => (
      <ol
        className={cn(
          "mb-6 list-decimal space-y-2.5 pl-6 text-[15px] leading-[1.65] text-muted-foreground marker:text-muted-foreground/55",
          "[&_ol]:mt-2 [&_ol]:mb-2",
          className
        )}
        {...props}
      />
    ),
    li: ({ className, children, ...props }) => (
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
    strong: ({ className, ...props }) => (
      <strong
        className={cn("font-semibold text-foreground", className)}
        {...props}
      />
    ),
    blockquote: ({ className, ...props }) => (
      <blockquote
        className={cn(
          "my-8 border-l-2 border-foreground/15 py-1 pl-5 text-[15px] italic leading-relaxed text-muted-foreground dark:border-foreground/25",
          className
        )}
        {...props}
      />
    ),
    hr: ({ className, ...props }) => (
      <hr className={cn("my-10 border-border", className)} {...props} />
    ),
    img: ({ className, alt, ...props }) => (
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
    table: ({ className, ...props }) => (
      <div className="my-6 overflow-x-auto rounded-lg border border-border">
        <table
          className={cn("w-full min-w-[20rem] text-left text-sm", className)}
          {...props}
        />
      </div>
    ),
    thead: ({ className, ...props }) => (
      <thead className={cn("border-b border-border bg-muted/40", className)} {...props} />
    ),
    th: ({ className, ...props }) => (
      <th
        className={cn(
          "px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
          className
        )}
        {...props}
      />
    ),
    td: ({ className, ...props }) => (
      <td
        className={cn(
          "border-b border-border/60 px-4 py-2.5 text-[15px] text-muted-foreground",
          className
        )}
        {...props}
      />
    ),
    ...components,
  };
}
