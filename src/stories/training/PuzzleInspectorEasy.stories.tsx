import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PuzzleBatchRunnerPage } from "@/features/playground/components/puzzle-batch-runner-page";
import { PuzzleWorkbenchPage } from "@/features/playground/components/puzzle-workbench-page";

const meta = {
  title: "Training System/Puzzle Inspector/Easy",
  component: PuzzleWorkbenchPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Internal workbench for validating Easy puzzle data. Reads `woodpecker-easy.json` only (not IndexedDB).",
      },
    },
  },
  args: {
    woodpeckerSetIds: ["woodpecker-easy"],
    workbenchTitle: "Easy puzzle workbench",
  },
} satisfies Meta<typeof PuzzleWorkbenchPage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Loads `woodpecker-easy.json` only (~400KB). */
export const Default: Story = {};

/** Auto-plays puzzle 1 onward, advancing after each solution line replays successfully. */
export const PlayAndCheck: Story = {
  render: () => (
    <PuzzleBatchRunnerPage
      woodpeckerSetIds={["woodpecker-easy"]}
      workbenchTitle="Easy puzzle play & check"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Loads puzzle 1 automatically. Use **Play all from start** to replay every solution line in order; stops on the first illegal move.",
      },
    },
  },
};
