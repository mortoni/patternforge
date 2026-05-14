import * as React from "react";
import { addons } from "storybook/preview-api";
import { SELECT_STORY } from "storybook/internal/core-events";

/**
 * App docs route slug → Storybook unattached-docs entry id (see storybook-static/index.json).
 * Keep aligned with wrappers in `src/stories/docs/product/`.
 */
export const SB_DOCS_IDS: Record<string, string> = {
  introduction: "introduction--docs",
  philosophy: "docs-philosophy--docs",
  "woodpecker-method": "docs-woodpecker-method--docs",
  lifecycle: "docs-lifecycle--docs",
  architecture: "docs-architecture--docs",
  "data-model": "docs-data-model--docs",
  decisions: "docs-design-decisions--docs",
  roadmap: "docs-roadmap-todos--docs",
};

const NEXT_APP_FALLBACK_ORIGIN =
  typeof process.env.STORYBOOK_APP_ORIGIN === "string" &&
  process.env.STORYBOOK_APP_ORIGIN.trim().length > 0
    ? process.env.STORYBOOK_APP_ORIGIN.trim()
    : "http://localhost:3000";

function parseDocsPath(href: string): { slug: string; hash: string } | null {
  if (!href.startsWith("/docs") && href !== "/docs") return null;
  let rest = href.slice("/docs".length);
  rest = rest.replace(/^\/?/, "");

  let slug = "";
  let hash = "";
  const si = rest.indexOf("#");
  if (si === -1) {
    slug = rest.split(/[?&]/)[0] ?? "";
  } else {
    slug = rest.slice(0, si).split(/[?&]/)[0] ?? "";
    hash = rest.slice(si);
  }
  slug = decodeURIComponent(slug).replace(/^\/+|\/+$/g, "");

  return { slug: slug || "", hash };
}

function navigateToSbDoc(storyId: string): void {
  const channel = addons.getChannel?.();
  if (channel) {
    channel.emit(SELECT_STORY, { storyId, viewMode: "docs" });
  }
}

/**
 * Overrides MDX `[text](/docs/foo)` anchors inside Storybook docs — does not run in Next.js.
 * Uses `selectStory` channel messages so navigation stays SPA-style (no full document reload).
 */
export function DocsMdxAnchor(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href, children, target, rel: relProp, onClick: onClickProp, ...rest } = props;

  if (typeof href !== "string") {
    return (
      <a href={href} target={target} rel={relProp} onClick={onClickProp} {...rest}>
        {children}
      </a>
    );
  }

  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target={target ?? "_blank"} rel={relProp ?? "noopener noreferrer"} {...rest}>
        {children}
      </a>
    );
  }

  const parsed = parseDocsPath(href);
  if (!parsed || !parsed.slug) {
    return (
      <a href={href} target={target} rel={relProp} onClick={onClickProp} {...rest}>
        {children}
      </a>
    );
  }

  const storyId = SB_DOCS_IDS[parsed.slug];
  if (storyId) {
    /** Fallback URL if addons channel is unavailable */
    const docPath = `/docs/${storyId}`;
    const fallbackHref = `/?path=${encodeURIComponent(docPath)}${parsed.hash ?? ""}`;

    return (
      <a
        {...rest}
        href={fallbackHref}
        /** Manager handles SPA navigation; avoids target=_parent hard reload */
        target={target}
        rel={relProp}
        onClick={(e) => {
          onClickProp?.(e);
          if (e.defaultPrevented) return;
          e.preventDefault();
          navigateToSbDoc(storyId);
        }}
      >
        {children}
      </a>
    );
  }

  const nextHref = `${NEXT_APP_FALLBACK_ORIGIN}${href.startsWith("/") ? href : `/${href}`}`;
  return (
    <a href={nextHref} target="_blank" rel={relProp ?? "noopener noreferrer"} {...rest}>
      {children}
    </a>
  );
}
