import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PuzzleWorkbenchPage } from "@/features/playground/components/puzzle-workbench-page";

const meta = {
  title: "Training System/Puzzle Inspector/Advanced",
  component: PuzzleWorkbenchPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Internal workbench for validating Advanced puzzle data. Reads `woodpecker-advanced.json` only (not IndexedDB).",
      },
    },
  },
  args: {
    woodpeckerSetIds: ["woodpecker-advanced"],
    workbenchTitle: "Advanced puzzle workbench",
  },
} satisfies Meta<typeof PuzzleWorkbenchPage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Loads `woodpecker-advanced.json` only. */
export const Default: Story = {};
