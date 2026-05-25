import type { Preview } from "@storybook/nextjs-vite";
import * as React from "react";
import { cn } from "../src/lib/utils";
import "../src/app/globals.css";
import { SettingsProvider } from "../src/features/settings/context/settings-context";
import { DocsMdxAnchor } from "./docs-mdx-anchor";

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const isFullscreen = context.parameters.layout === "fullscreen";
      const isDocs = context.viewMode === "docs";

      return (
        <SettingsProvider>
          <div
            className={cn(
              "min-h-screen bg-background text-foreground",
              !isFullscreen && !isDocs && "p-4"
            )}
          >
            {isDocs && !isFullscreen ? (
              <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 md:py-12">
                <Story />
              </div>
            ) : (
              <Story />
            )}
          </div>
        </SettingsProvider>
      );
    },
  ],
  parameters: {
    docs: {
      components: {
        a: DocsMdxAnchor,
      },
      toc: {
        headingSelector: "h2, h3",
        title: "On this page",
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
        order: [
          "Introduction",
          [
            "Product",
            ["Philosophy", "Woodpecker Method", "Roadmap"],
          ],
          [
            "Architecture",
            [
              "Overview",
              "Local-First",
              "State & Persistence",
              "Data Model",
              "Design Decisions",
            ],
          ],
          [
            "Training System",
            [
              "Training Cycles",
              "Training Lifecycle",
              "Reflection",
              "UX Continuity",
              "Puzzle Inspector",
            ],
          ],
          [
            "Development Guides",
            [
              "Getting Started",
              "Project Structure",
              "Running Storybook",
              "Running Tests",
              "Adding Training Sets",
              "Engineering Conventions",
            ],
          ],
          [
            "Foundations",
            ["Design Tokens", "Accessibility"],
          ],
        ],
      },
    },

    a11y: {
      test: "todo",
    },
  },
};

export default preview;
