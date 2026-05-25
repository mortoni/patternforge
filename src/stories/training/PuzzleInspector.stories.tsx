import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PuzzleWorkbenchPage } from "@/features/playground/components/puzzle-workbench-page";

/**
 * Developer tool for inspecting puzzles from IndexedDB — same data as the live app.
 * Seed training sets in dev before use.
 */
const meta = {
  title: "Training System/Puzzle Inspector",
  component: PuzzleWorkbenchPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Internal workbench for validating puzzle data, FEN positions, and solution lines against the training library.",
      },
    },
  },
} satisfies Meta<typeof PuzzleWorkbenchPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
