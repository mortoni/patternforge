import type { StorybookConfig } from "@storybook/nextjs-vite";

/** Fallback base URL for unmirrorable `/docs/…` links (e.g. Next dev server). */
const STORYBOOK_APP_ORIGIN_RAW = process.env.STORYBOOK_APP_ORIGIN ?? "";

const config = {
  // Handbook Introduction first → `src/docs` embedded under Docs/* → CSF stories.
  stories: [
    "../src/stories/docs/Introduction.mdx",
    "../src/stories/docs/product/**/*.mdx",
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
    return viteConfig;
  },
} satisfies StorybookConfig;

export default config;