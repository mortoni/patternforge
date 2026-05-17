import { BarChart3, ChessKnight, Target, type LucideIcon } from "lucide-react";
import {
  AmbientBreathOrb,
  FadeIn,
  MotionPreviewFrame,
} from "@/components/shared/motion-primitives";
import { cn } from "@/lib/utils";
import {
  TrainingLoopMasteryDevicePreview,
  TrainingLoopProgressDevicePreview,
  TrainingLoopSolveDevicePreview,
} from "@/components/marketing/sections/home-training-loop-device-previews";

function FeatureBlock({
  icon: Icon,
  title,
  description,
  iconGlow = "soft",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  iconGlow?: "soft" | "hero";
}) {
  return (
    <div className="mx-auto flex w-full max-w-[16.5rem] flex-col items-center text-center sm:max-w-[17.5rem]">
      <div
        className={cn(
          "mb-3.5 flex size-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-sm dark:border-primary/35 dark:bg-primary/[0.14] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
          iconGlow === "hero" &&
            "border-primary/45 bg-primary/[0.16] shadow-md shadow-primary/10 dark:border-primary/50 dark:bg-primary/[0.22] dark:shadow-[0_0_36px_-8px_color-mix(in_oklab,var(--primary)_55%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
        )}
      >
        <Icon className="size-[22px]" strokeWidth={1.6} aria-hidden focusable={false} />
      </div>
      <h3 className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
        {description}
      </p>
    </div>
  );
}

export function HomeTrainingLoopSection() {
  return (
    <section
      id="philosophy"
      className={cn(
        "relative w-full scroll-mt-4 overflow-x-clip px-3.5 pt-14 pb-[5.25rem] sm:px-5 sm:pt-16 sm:pb-[5.5rem] md:px-6 md:pt-[4.75rem] md:pb-28 lg:px-10 lg:pt-[5.25rem]",
        "bg-gradient-to-b from-muted/[0.105] via-background via-[42%] to-background text-foreground",
        "dark:from-[#05070f] dark:via-[#070a12] dark:to-[#060811] dark:text-slate-100",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[min(10rem,22vh)] before:bg-[radial-gradient(ellipse_72%_100%_at_50%_0%,color-mix(in_oklab,var(--muted-foreground)_4%,transparent),transparent_74%)] before:opacity-70",
        "dark:before:bg-[radial-gradient(ellipse_72%_100%_at_50%_0%,color-mix(in_oklab,var(--primary)_7%,transparent),transparent_72%)] dark:before:opacity-90"
      )}
      aria-labelledby="training-in-action-heading"
    >
      <div id="training-in-action" />
      <AmbientBreathOrb
        emphasis="section"
        className="pointer-events-none absolute left-1/2 top-[42%] hidden h-[min(420px,48vh)] w-[min(900px,94vw)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_44%_40%_at_50%_48%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_74%)] opacity-45 dark:opacity-90 lg:block"
      />

      <div className="relative z-[1] mx-auto max-w-[min(100%,88rem)]">
        <div className="mx-auto max-w-3xl text-pretty text-center xl:max-w-4xl">
          <FadeIn y={12} duration={0.48}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
              Training loop
            </p>
          </FadeIn>
          <FadeIn y={12} duration={0.52} delay={0.05}>
            <h2
              id="training-in-action-heading"
              className="mt-4 text-balance text-[clamp(1.85rem,5vw,3.35rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground dark:text-white sm:mt-5"
            >
              Train. Repeat. Recognize faster.
            </h2>
          </FadeIn>
          <FadeIn y={10} duration={0.48} delay={0.1}>
            <p className="mx-auto mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">
              Repetition turns calculation into recognition.
            </p>
          </FadeIn>
        </div>

        <div className="relative mx-auto mt-12 max-w-[min(100%,86rem)] sm:mt-14 md:mt-16 lg:mt-[4.25rem]">
          <div className="grid grid-cols-1 gap-12 sm:gap-14 lg:grid-cols-12 lg:items-end lg:gap-x-4 lg:gap-y-0 xl:gap-x-6">
            {/* Progress — left on desktop */}
            <div className="order-2 flex flex-col items-center lg:order-none lg:col-span-4 lg:pb-6">
              <div className="relative mb-10 flex w-full justify-center sm:mb-11 lg:mb-12 lg:min-h-[19rem] lg:items-end">
                <div
                  className={cn(
                    "relative w-[min(100%,15.25rem)] origin-center scale-[0.94] opacity-[0.8] transition-[opacity,transform] duration-500 ease-out sm:w-[min(100%,16rem)]",
                    "lg:-translate-x-1 lg:translate-y-3",
                    "lg:hover:opacity-[0.88]"
                  )}
                >
                  <div
                    className={cn(
                      "[transform-style:preserve-3d] will-change-transform [transform:perspective(1000px)_rotateY(20deg)_rotateX(15deg)]",
                      "rounded-[2.1rem] shadow-lg shadow-black/10 ring-1 ring-black/[0.06] dark:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.75)] dark:ring-white/15 dark:backdrop-blur-[1.5px]"
                    )}
                  >
                    <TrainingLoopProgressDevicePreview title="Training loop — progress preview" />
                  </div>
                </div>
              </div>
              <FeatureBlock
                icon={BarChart3}
                title="Track the cycle"
                description="See your progress and stay consistent with every session."
              />
            </div>

            {/* Solve — centre hero */}
            <div className="order-1 flex flex-col items-center lg:order-none lg:col-span-4">
              <div className="relative mb-10 flex w-full justify-center sm:mb-11 lg:mb-14">
                <div
                  className="pointer-events-none absolute left-1/2 top-[46%] z-0 h-[min(115%,26rem)] w-[min(92%,19rem)] -translate-x-1/2 -translate-y-1/2 rounded-[3rem] bg-[radial-gradient(ellipse_52%_48%_at_50%_50%,color-mix(in_oklab,var(--primary)_28%,transparent),transparent_70%)] opacity-[0.65] blur-2xl dark:bg-[radial-gradient(ellipse_52%_48%_at_50%_50%,rgba(139,92,246,0.42),rgba(99,102,241,0.16)_48%,transparent_72%)] dark:opacity-90 sm:w-[min(94%,20.5rem)]"
                  aria-hidden
                />
                <MotionPreviewFrame
                  emphasis="hero"
                  className="relative z-[1] w-[min(100%,18.25rem)] sm:w-[min(100%,20rem)] lg:w-[min(100%,22rem)] xl:w-[min(100%,22.5rem)]"
                >
                  <div
                    className={cn(
                      "relative rounded-[2rem]",
                      "shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_10%,transparent),0_12px_40px_-16px_color-mix(in_oklab,var(--primary)_22%,transparent)]",
                      "dark:shadow-[0_0_0_1px_rgba(196,181,253,0.35),0_0_52px_-10px_color-mix(in_oklab,var(--primary)_48%,transparent),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                    )}
                  >
                    <TrainingLoopSolveDevicePreview
                      className="w-full"
                      title="Training loop — active exercise preview"
                    />
                  </div>
                </MotionPreviewFrame>
              </div>
              <FeatureBlock
                icon={ChessKnight}
                iconGlow="hero"
                title="Solve the position"
                description="Stay with the same puzzle line. Build familiarity. Build speed."
              />
            </div>

            {/* Mastery — right */}
            <div className="order-3 flex flex-col items-center lg:order-none lg:col-span-4 lg:pb-6">
              <div className="relative mb-10 flex w-full justify-center sm:mb-11 lg:mb-12 lg:min-h-[19rem] lg:items-end">
                <div
                  className={cn(
                    "relative w-[min(100%,15.25rem)] origin-center scale-[0.94] opacity-[0.8] transition-[opacity,transform] duration-500 ease-out sm:w-[min(100%,16rem)]",
                    "lg:translate-x-1 lg:translate-y-3",
                    "lg:hover:opacity-[0.88]"
                  )}
                >
                  <div
                    className={cn(
                      "[transform-style:preserve-3d] will-change-transform [transform:perspective(1000px)_rotateY(-20deg)_rotateX(15deg)]",
                      "rounded-[2.1rem] shadow-lg shadow-black/10 ring-1 ring-black/[0.06] dark:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.75)] dark:ring-white/15 dark:backdrop-blur-[1.5px]"
                    )}
                  >
                    <TrainingLoopMasteryDevicePreview title="Training loop — mastery preview" />
                  </div>
                </div>
              </div>
              <FeatureBlock
                icon={Target}
                title="Measure mastery"
                description="Watch recognition speed improve as patterns become familiar."
              />
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-36 bg-gradient-to-b from-transparent via-background/70 to-background dark:via-[#070a12]/80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[5%] bottom-0 z-[2] mx-auto h-px max-w-[76rem] bg-gradient-to-r from-transparent via-border/35 to-transparent dark:via-white/12"
      />
    </section>
  );
}
