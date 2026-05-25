import * as React from "react";
import { StorybookDocLink, type StorybookDocLinkProps } from "@/lib/storybook-doc-link";

/** Storybook MDX anchor override — re-exports shared doc link. */
export function DocsMdxAnchor(props: StorybookDocLinkProps) {
  return <StorybookDocLink {...props} />;
}

export { SB_DOCS_IDS, parseDocsPath } from "@/lib/storybook-docs-ids";
