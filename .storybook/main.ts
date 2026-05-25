import type { StorybookConfig } from "@storybook/nextjs-vite";

/** Fallback base URL for unmirrorable `/docs/…` links (e.g. Next dev server). */
const STORYBOOK_APP_ORIGIN_RAW = process.env.STORYBOOK_APP_ORIGIN ?? "";

const config = {
  // Handbook Introduction first → `src/docs` embedded under Docs/* → CSF stories.
  stories: [
    "../src/stories/docs/Introduction.mdx",
    "../src/stories/docs/product/**/*.mdx",
    "../src/stories/docs/architecture/**/*.mdx",
    "../src/stories/docs/training/**/*.mdx",
    "../src/stories/docs/development/**/*.mdx",
    "../src/stories/docs/foundations/**/*.mdx",
    "../src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/nextjs-vite",
  staticDirs: ["../public"],

  async viteFinal(viteConfig) {
    viteConfig.define = {
      ...viteConfig.define,
      "process.env.STORYBOOK_APP_ORIGIN":
        JSON.stringify(STORYBOOK_APP_ORIGIN_RAW),
    };
    /** Subpath for static hosting (e.g. GitHub Pages project site). Set in CI via STORYBOOK_BASE_PATH. */
    const basePath = process.env.STORYBOOK_BASE_PATH?.trim();
    if (basePath) {
      viteConfig.base = basePath.endsWith("/") ? basePath : `${basePath}/`;
    }
    return viteConfig;
  },
} satisfies StorybookConfig;

export default config;