/**
 * Slug paths used in MDX (`/docs/foo`) → Storybook docs entry id.
 * Regenerate ids via `pnpm build-storybook` + `storybook-static/index.json` when titles change.
 */
export const SB_DOCS_IDS: Record<string, string> = {
  introduction: "introduction--docs",

  philosophy: "product-philosophy--docs",
  "woodpecker-method": "product-woodpecker-method--docs",
  roadmap: "product-roadmap--docs",

  architecture: "architecture-overview--docs",
  "architecture/local-first": "architecture-local-first--docs",
  "architecture/persistence": "architecture-state-persistence--docs",
  "data-model": "architecture-data-model--docs",
  decisions: "architecture-design-decisions--docs",

  "training/lifecycle": "training-system-training-lifecycle--docs",
  "training/training-lifecycle": "training-system-training-lifecycle--docs",
  lifecycle: "training-system-training-lifecycle--docs",
  "training/cycles": "training-system-training-cycles--docs",
  "training/reflection": "training-system-reflection--docs",
  "training/ux-continuity": "training-system-ux-continuity--docs",

  "dev/getting-started": "development-guides-getting-started--docs",
  "dev/project-structure": "development-guides-project-structure--docs",
  "dev/running-storybook": "development-guides-running-storybook--docs",
  "dev/running-tests": "development-guides-running-tests--docs",
  "dev/adding-training-sets": "development-guides-adding-training-sets--docs",
  "dev/engineering-conventions": "development-guides-engineering-conventions--docs",

  "foundations/design-tokens": "foundations-design-tokens--docs",
  "foundations/accessibility": "foundations-accessibility--docs",
};

export function parseDocsPath(href: string): { slug: string; hash: string } | null {
  if (!href.startsWith("/docs") && href !== "/docs") return null;

  let rest = href.slice("/docs".length);
  rest = rest.replace(/^\/?/, "");

  let slug = "";
  let hash = "";
  const hashIndex = rest.indexOf("#");
  if (hashIndex === -1) {
    slug = rest.split(/[?&]/)[0] ?? "";
  } else {
    slug = rest.slice(0, hashIndex).split(/[?&]/)[0] ?? "";
    hash = rest.slice(hashIndex);
  }

  slug = decodeURIComponent(slug).replace(/^\/+|\/+$/g, "");
  return { slug: slug || "", hash };
}

export function resolveStorybookDocStoryId(href: string): string | null {
  const parsed = parseDocsPath(href);
  if (!parsed?.slug) return null;
  return SB_DOCS_IDS[parsed.slug] ?? null;
}

/** Full Storybook manager URL — works from the preview iframe via target="_parent". */
export function storybookManagerDocUrl(storyId: string, hash = ""): string | null {
  if (typeof window === "undefined") return null;
  try {
    const top = window.top ?? window;
    const url = new URL(top.location.href);
    url.searchParams.set("path", `/docs/${storyId}${hash}`);
    return url.toString();
  } catch {
    return null;
  }
}

export function storybookDocHref(storyId: string, hash = ""): string {
  return `?path=/docs/${storyId}${hash}`;
}
