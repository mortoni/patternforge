import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PuzzleWorkbenchPage } from "@/features/playground/components/puzzle-workbench-page";

/**
 * Puzzle workbench: load puzzles from the same IndexedDB training-set data as the app.
 * Start `pnpm storybook` and optionally seed data from the Training Sets UI in dev first.
 */
const meta = {
  title: "Workbench/Puzzle Inspector",
  component: PuzzleWorkbenchPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PuzzleWorkbenchPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PuzzleInspector: Story = {};
