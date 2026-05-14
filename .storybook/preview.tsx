import type { Preview } from "@storybook/nextjs-vite";
import * as React from "react";
import "../src/app/globals.css";
import { SettingsProvider } from "../src/features/settings/context/settings-context";
import { DocsMdxAnchor } from "./docs-mdx-anchor";

const preview: Preview = {
  decorators: [
    (Story) => (
      <SettingsProvider>
        <div className="min-h-screen bg-background p-4 text-foreground">
          <Story />
        </div>
      </SettingsProvider>
    ),
  ],
  parameters: {
    docs: {
      components: {
        a: DocsMdxAnchor,
      },
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    options: {
      storySort: {
        // Sidebar: Introduction (src/docs/introduction via Stories entry) → Docs/* → Workbench
        order: [
          "Introduction",
          [
            "Docs",
            [
              "Philosophy",
              "Woodpecker Method",
              "Lifecycle",
              "Architecture",
              "Data Model",
              "Design Decisions",
              "Roadmap & TODOs",
            ],
          ],
          ["Workbench", ["Puzzle Inspector"]],
        ],
      },
    },

    a11y: {
      test: "todo",
    },
  },
};

export default preview;
