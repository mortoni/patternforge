"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MarketingSubpageShell } from "@/components/marketing/marketing-subpage-shell";
import { ROUTES } from "@/lib/constants";

const docsPages = [
  {
    title: "Introduction",
    slug: "introduction",
    group: "Getting Started",
  },
  {
    title: "Philosophy",
    slug: "philosophy",
    group: "Concepts",
  },
  {
    title: "Woodpecker Method",
    slug: "woodpecker-method",
    group: "Concepts",
  },
  {
    title: "Lifecycle",
    slug: "lifecycle",
    group: "Concepts",
  },
  {
    title: "Architecture",
    slug: "architecture",
    group: "Technical",
  },
  {
    title: "Data Model",
    slug: "data-model",
    group: "Technical",
  },
  {
    title: "Design Decisions",
    slug: "decisions",
    group: "Technical",
  },
  {
    title: "Roadmap & TODOs",
    slug: "roadmap",
    group: "Planning",
  },
] as const;

const groups = [
  { name: "Getting Started", pages: docsPages.filter((p) => p.group === "Getting Started") },
  { name: "Concepts", pages: docsPages.filter((p) => p.group === "Concepts") },
  { name: "Technical", pages: docsPages.filter((p) => p.group === "Technical") },
  { name: "Planning", pages: docsPages.filter((p) => p.group === "Planning") },
];

const linkClass =
  "block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground";
const activeLinkClass =
  "block rounded-md bg-muted/70 px-3 py-2 text-sm font-medium text-foreground";

function DocsSidebar({ currentSlug }: { currentSlug: string | null }) {
  return (
    <aside className="hidden shrink-0 border-border bg-muted/25 md:block md:w-56 md:border-r lg:w-64">
      <nav className="sticky top-0 max-h-[calc(100dvh-3.75rem)] overflow-y-auto px-5 py-8 lg:px-6">
        <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Documentation
        </p>
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.name}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.name}
              </h2>
              <ul className="space-y-1">
                {group.pages.map((page) => {
                  const isActive = currentSlug === page.slug;
                  return (
                    <li key={page.slug}>
                      <Link
                        href={`${ROUTES.docs}/${page.slug}`}
                        className={isActive ? activeLinkClass : linkClass}
                      >
                        {page.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}

function DocsMobileNav({ currentSlug }: { currentSlug: string | null }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mb-6 w-full rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/40"
      >
        {open ? "Hide navigation" : "Browse docs"}
      </button>
      {open && (
        <nav className="mb-10 space-y-6 rounded-xl border border-border bg-muted/20 p-5">
          {groups.map((group) => (
            <div key={group.name}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.name}
              </h2>
              <ul className="space-y-1">
                {group.pages.map((page) => {
                  const isActive = currentSlug === page.slug;
                  return (
                    <li key={page.slug}>
                      <Link
                        href={`${ROUTES.docs}/${page.slug}`}
                        onClick={() => setOpen(false)}
                        className={isActive ? activeLinkClass : linkClass}
                      >
                        {page.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}

export default function DocsPage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentSlug = pathname?.replace(`${ROUTES.docs}/`, "") || null;

  return (
    <MarketingSubpageShell fullWidthMain wordmark="app-title">
      <div className="flex min-h-[calc(100dvh-3.75rem)] w-full flex-col md:flex-row">
        <DocsSidebar currentSlug={currentSlug} />
        <div className="min-w-0 flex-1 bg-background">
          <div className="mx-auto w-full max-w-[52rem] px-4 py-8 sm:px-6 lg:px-12 lg:py-12 xl:max-w-[56rem]">
            <DocsMobileNav currentSlug={currentSlug} />

            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 shadow-sm dark:border-border/50 dark:bg-card/25 sm:p-8 lg:p-10 xl:p-12">
              <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground md:hidden">
                Documentation
              </p>
              <div className="mx-auto max-w-[42rem]">
                <article className="text-foreground antialiased">
                  {children}
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingSubpageShell>
  );
}
