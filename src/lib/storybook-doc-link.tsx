import * as React from "react";
import { addons, DocsContext } from "storybook/preview-api";
import { NAVIGATE_URL } from "storybook/internal/core-events";
import { cn } from "@/lib/utils";
import {
  parseDocsPath,
  resolveStorybookDocStoryId,
  storybookDocHref,
  storybookManagerDocUrl,
} from "@/lib/storybook-docs-ids";

const NEXT_APP_FALLBACK_ORIGIN =
  typeof process.env.NEXT_PUBLIC_SITE_URL === "string" &&
  process.env.NEXT_PUBLIC_SITE_URL.trim().length > 0
    ? process.env.NEXT_PUBLIC_SITE_URL.trim()
    : "http://localhost:3000";

type DocsChannel = { emit: (event: string, ...args: unknown[]) => void };
type DocsContextValue = { channel?: DocsChannel } | null;

/** Storybook exports DocsContext in a shape that does not satisfy React's Context type under strict tsc. */
const storybookDocsContext =
  DocsContext as unknown as React.Context<DocsContextValue>;

function getStorybookChannel(docsContext: DocsContextValue): DocsChannel | undefined {
  return docsContext?.channel ?? addons.getChannel?.();
}

function isPlainLeftClick(event: React.MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

function navigateViaChannel(docsContext: DocsContextValue, navigateUrl: string): boolean {
  const channel = getStorybookChannel(docsContext);
  if (!channel) return false;
  channel.emit(NAVIGATE_URL, navigateUrl);
  return true;
}

export type StorybookDocLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

/**
 * Storybook docs link. Uses target="_parent" + manager URL so clicks work from
 * custom MDX components (DocCard) that sit outside DocsContext.
 */
export function StorybookDocLink({
  href,
  children,
  className,
  target,
  rel: relProp,
  onClick: onClickProp,
  ...rest
}: StorybookDocLinkProps) {
  const docsContext = React.useContext(storybookDocsContext);

  if (typeof href !== "string") {
    return (
      <a href={href} className={className} target={target} rel={relProp} onClick={onClickProp} {...rest}>
        {children}
      </a>
    );
  }

  if (/^https?:\/\//i.test(href)) {
    return (
      <a
        href={href}
        className={className}
        target={target ?? "_blank"}
        rel={relProp ?? "noopener noreferrer"}
        onClick={onClickProp}
        {...rest}
      >
        {children}
      </a>
    );
  }

  const storyId = resolveStorybookDocStoryId(href);
  const parsed = parseDocsPath(href);

  if (storyId) {
    const hash = parsed?.hash ?? "";
    const navigateUrl = storybookDocHref(storyId, hash);
    const managerUrl = storybookManagerDocUrl(storyId, hash);

    return (
      <a
        {...rest}
        href={managerUrl ?? navigateUrl}
        className={cn("no-underline", className)}
        target={target ?? "_parent"}
        rel={relProp}
        onClick={(e) => {
          onClickProp?.(e);
          if (e.defaultPrevented || !isPlainLeftClick(e)) return;
          if (navigateViaChannel(docsContext, navigateUrl)) {
            e.preventDefault();
          }
        }}
      >
        {children}
      </a>
    );
  }

  if (parsed?.slug) {
    const nextHref = `${NEXT_APP_FALLBACK_ORIGIN}${href.startsWith("/") ? href : `/${href}`}`;
    return (
      <a
        href={nextHref}
        className={className}
        target="_blank"
        rel={relProp ?? "noopener noreferrer"}
        onClick={onClickProp}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <a href={href} className={className} target={target} rel={relProp} onClick={onClickProp} {...rest}>
      {children}
    </a>
  );
}
