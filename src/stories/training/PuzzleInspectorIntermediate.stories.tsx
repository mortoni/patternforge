import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PuzzleWorkbenchPage } from "@/features/playground/components/puzzle-workbench-page";

const meta = {
  title: "Training System/Puzzle Inspector/Intermediate",
  component: PuzzleWorkbenchPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Internal workbench for validating Intermediate puzzle data. Reads `woodpecker-intermediate.json` only (not IndexedDB).",
      },
    },
  },
  args: {
    woodpeckerSetIds: ["woodpecker-intermediate"],
    workbenchTitle: "Intermediate puzzle workbench",
  },
} satisfies Meta<typeof PuzzleWorkbenchPage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Loads `woodpecker-intermediate.json` only. */
export const Default: Story = {};
