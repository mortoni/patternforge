import type { PreviewTrainingParams } from "@/lib/preview/preview-training-url";
import {
  type MasteryMarketingPreviewProps,
  type ProgressMarketingPreviewProps,
} from "@/features/marketing/components/training-in-action-flow-previews";

export type TrainingInActionVisual =
  | {
      kind: "phone";
      preview: Omit<PreviewTrainingParams, "appearance">;
      iframeTitle: string;
    }
  | {
      kind: "progress";
      iframeTitle: string;
      preview: ProgressMarketingPreviewProps;
    }
  | {
      kind: "mastery";
      iframeTitle: string;
      preview: MasteryMarketingPreviewProps;
    };

/**
 * Landing preview narrative — one active Woodpecker line (Intermediate, 762) in cycle 3 around
 * exercise ~142; completed passes 1→4 timings stay aligned with mastery + time-compression.
 */
export const LANDING_SET_NAME = "Woodpecker Intermediate";
export const LANDING_LINE_TOTAL = 762;
export const LANDING_ACTIVE_CYCLE = 3;
export const LANDING_ACTIVE_EXERCISE = 142;
const LANDING_LAST_BLOCK_MS = 12 * 60 * 1000 + 34_000;

export const LANDING_TRAINING_CHROME = {
  puzzle: LANDING_ACTIVE_EXERCISE,
  total: LANDING_LINE_TOTAL,
  cycle: LANDING_ACTIVE_CYCLE,
  setName: LANDING_SET_NAME,
  boardStyle: "blueprint" as const,
} satisfies Omit<PreviewTrainingParams, "appearance">;

/** Hero + centre “Solve” column in the training loop — same preview params + default phone shell (`430×932`). */
export const MARKETING_HERO_PHONE_PREVIEW = {
  screen: "sm" as const,
  ...LANDING_TRAINING_CHROME,
} satisfies Omit<PreviewTrainingParams, "appearance">;

export const MARKETING_LOOP_PROGRESS_PREVIEW = {
  trainingSetName: LANDING_SET_NAME,
  cycleNumber: LANDING_ACTIVE_CYCLE,
  nextExerciseIndex: LANDING_ACTIVE_EXERCISE,
  totalExercises: LANDING_LINE_TOTAL,
  exercisesRemaining: LANDING_LINE_TOTAL - LANDING_ACTIVE_EXERCISE,
  sessionCountThisCycle: 6,
  lastSessionDurationMs: LANDING_LAST_BLOCK_MS,
  cycleStartedLabel: "9 May · picked up again after a quiet weekend pause",
  continuityHint:
    "Weekday commuter blocks mostly — uneven lengths, but the fifth pass is creeping forward steadily.",
  recentSessions: [
    {
      dayLabel: "Today · 06:52",
      exercisesDone: 24,
      durationMs: LANDING_LAST_BLOCK_MS,
    },
    {
      dayLabel: "Yesterday · 07:41",
      exercisesDone: 31,
      durationMs: 14 * 60 * 1000 + 47_000,
    },
    {
      dayLabel: "Wed 14 May · evening",
      exercisesDone: 18,
      durationMs: 9 * 60 * 1000 + 21_000,
    },
    {
      dayLabel: "Mon 12 May · desk block",
      exercisesDone: 42,
      durationMs: 23 * 60 * 1000 + 8_900,
    },
  ],
} satisfies ProgressMarketingPreviewProps;

/** Completed cycles (oldest first) shared with mastery + payoff graphic (`totalMs` mildly imperfect). */
export const MARKETING_LANDING_COMPLETED_PASSES_MS = [
  { cycleNumber: 1, totalTimeMs: 105 * 60 * 1000 },
  { cycleNumber: 2, totalTimeMs: 58 * 60 * 1000 },
  { cycleNumber: 3, totalTimeMs: 32 * 60 * 1000 },
  { cycleNumber: 4, totalTimeMs: 17 * 60 * 1000 + 53_000 },
] as const satisfies ReadonlyArray<MasteryMarketingPreviewProps["cycles"][number]>;

export const LANDING_CYCLE_COMPRESSION_PCT = Math.round(
  (1 -
    MARKETING_LANDING_COMPLETED_PASSES_MS[3].totalTimeMs /
      MARKETING_LANDING_COMPLETED_PASSES_MS[0].totalTimeMs) *
    100
);

const LOOP_MASTERY_INSIGHT = `About ${LANDING_CYCLE_COMPRESSION_PCT}% less wall-clock from first pass to fourth`;

const LOOP_MASTERY_RECOGNITION_LINE =
  "Fourth pass dipped under eighteen minutes—wall-clock collapsing as motifs move from search to fluent recognition.";

export const trainingInActionCards: Array<{
  role: "track" | "solve" | "master";
  step: string;
  title: string;
  body: string;
  mode: "center" | "side";
  visual: TrainingInActionVisual;
}> = [
  {
    role: "track",
    step: "01 TRACK",
    title: "Track the cycle",
    body:
      "One roster, resumed across weeks: session bookmarks hold your place while repeated exposure compounds recall.",
    mode: "side",
    visual: {
      kind: "progress",
      iframeTitle: "Training loop — progress / current cycle preview",
      preview: MARKETING_LOOP_PROGRESS_PREVIEW,
    },
  },
  {
    role: "solve",
    step: "02 SOLVE",
    title: "Solve the position",
    body:
      "A bounded tactical line—not an endless novelty feed—so motifs return often enough for patterns to settle.",
    mode: "center",
    visual: {
      kind: "phone",
      iframeTitle: "Training loop — active exercise preview",
      preview: MARKETING_HERO_PHONE_PREVIEW,
    },
  },
  {
    role: "master",
    step: "03 MASTER",
    title: "Measure mastery",
    body:
      "Full-pass durations trend down cycle to cycle—a quiet chart of recognition accelerating where brute search used to linger.",
    mode: "side",
    visual: {
      kind: "mastery",
      iframeTitle: "Training loop — mastery preview",
      preview: {
        trainingSetName: LANDING_SET_NAME,
        cycles: [...MARKETING_LANDING_COMPLETED_PASSES_MS],
        insightLine: LOOP_MASTERY_INSIGHT,
        recognitionLine: LOOP_MASTERY_RECOGNITION_LINE,
      },
    },
  },
];

/**
 * Continue-anywhere section: identical cycle / set / exercise on both previews so live UI reads as
 * one session carried across contexts (continuity cues in meta + board position).
 */
export const CONTINUE_ANYWHERE_DESKTOP_PREVIEW = {
  screen: "lg" as const,
  ...LANDING_TRAINING_CHROME,
} satisfies Omit<PreviewTrainingParams, "appearance">;

export const CONTINUE_ANYWHERE_MOBILE_PREVIEW = {
  screen: "sm" as const,
  ...LANDING_TRAINING_CHROME,
} satisfies Omit<PreviewTrainingParams, "appearance">;

/** How recognition shifts over repeated cycles (psychological arc, not UI steps). */
export const methodSteps = [
  {
    title: "Choose a line",
    body: "Commit to a small tactical set you will revisit again and again.",
  },
  {
    title: "Recognition slows calculation",
    body: "The first passes feel effortful. Each move still asks for deliberate, conscious calculation.",
  },
  {
    title: "Patterns start resurfacing",
    body: "Positions begin to feel familiar before the full calculation has finished.",
  },
  {
    title: "Recall becomes immediate",
    body: "The right ideas show up faster, with less conscious effort holding the thread.",
  },
  {
    title: "Time begins collapsing",
    body: "The same cycle needs a fraction of the wall-clock and attention it once did.",
  },
] as const;

export const TIME_COMPRESSION_CYCLES = MARKETING_LANDING_COMPLETED_PASSES_MS.map((c) => ({
  cycle: c.cycleNumber,
  totalMs: c.totalTimeMs,
}));

export const TIME_COMPRESSION_REDUCTION_LABEL = `~${LANDING_CYCLE_COMPRESSION_PCT}% less wall-clock after four cycles`;
