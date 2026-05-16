import {
  FadeIn,
  MotionPreviewFrame,
  MotionScreenshot,
  StaggeredSectionHeader,
} from "@/components/shared/motion-primitives";
import { cn } from "@/lib/utils";
import { TrainingIframePair } from "@/components/marketing/components/training-iframe-pair";
import {
  CONTINUE_ANYWHERE_DESKTOP_PREVIEW,
  CONTINUE_ANYWHERE_MOBILE_PREVIEW,
} from "@/components/marketing/home-landing-data";
import { containerClass } from "@/components/marketing/layout-classes";

export function HomeContinueAnywhereSection() {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-background py-[3.875rem] sm:py-16 md:py-[5.75rem]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[min(10rem,24vh)] before:bg-[radial-gradient(ellipse_75%_100%_at_50%_0%,color-mix(in_oklab,var(--primary)_3.5%,transparent),transparent_76%)] before:opacity-45 dark:before:opacity-55"
      )}
      aria-labelledby="continue-anywhere-heading"
    >
      <div className={containerClass}>
        <StaggeredSectionHeader
          headingId="continue-anywhere-heading"
          eyebrow="CONTINUITY"
          eyebrowClassName="tracking-[0.12em] text-muted-foreground/60"
          title="Continue anywhere"
          body="When you have quiet space, settle in with the full board. When you only have a moment, reopen the same pass on your phone—the set, cycle, and position stay aligned so deliberate-practice continuity survives real life."
          className="max-w-2xl sm:max-w-3xl [&_p]:max-w-2xl [&_p]:text-pretty"
        />

        <div className="mx-auto mt-11 max-w-7xl sm:mt-12 lg:mt-14">
          <div className="space-y-10 lg:hidden">
            <FadeIn>
              <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">
                Deep focus
              </p>
              <MotionScreenshot>
                <div className="w-full min-w-0">
                  <MotionPreviewFrame emphasis="standard" className="block w-full">
                    <TrainingIframePair
                      className="w-full"
                      title="PatternForge — desktop workspace, same training pass (cycle 3)"
                      preview={CONTINUE_ANYWHERE_DESKTOP_PREVIEW}
                    />
                  </MotionPreviewFrame>
                </div>
              </MotionScreenshot>
            </FadeIn>
            <div className="relative mx-auto flex flex-col items-center pt-1">
              <div
                className="pointer-events-none absolute top-2 h-20 w-40 rounded-full bg-[radial-gradient(circle,rgba(124,82,255,0.12),transparent_72%)] blur-2xl"
                aria-hidden
              />
              <FadeIn delay={0.08}>
                <p className="relative z-10 mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">
                  Same cycle, continued
                </p>
                <MotionScreenshot className="relative z-10 w-full">
                  <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[18.5rem] justify-center sm:max-w-[19rem]">
                    <MotionPreviewFrame emphasis="standard" className="flex w-full justify-center">
                      <TrainingIframePair
                        className="w-full"
                        title="PatternForge — continue the same training pass on mobile (cycle 3)"
                        preview={CONTINUE_ANYWHERE_MOBILE_PREVIEW}
                        phoneShellClassName="max-w-full sm:max-w-[19rem]"
                        phoneAspectClassName="aspect-[430/680]"
                        smAspectHeight={680}
                        smFillContainer={false}
                        compactHeroLayout
                        preventShortEmbedFrame
                      />
                    </MotionPreviewFrame>
                  </div>
                </MotionScreenshot>
              </FadeIn>
            </div>
          </div>

          <div className="relative hidden pb-28 pt-2 lg:block xl:pb-[8.75rem]">
            <div
              className="pointer-events-none absolute left-[14%] top-[6%] h-[min(420px,48%)] w-[min(92%,52rem)] rounded-full bg-[radial-gradient(ellipse_at_50%_40%,rgba(124,82,255,0.11),transparent_70%)] blur-3xl dark:bg-[radial-gradient(ellipse_at_50%_40%,rgba(124,82,255,0.14),transparent_70%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute right-[14%] top-[52%] z-[8] hidden h-px w-[min(26%,13rem)] -translate-y-1/2 bg-gradient-to-r from-transparent via-border/45 to-transparent opacity-90 xl:block dark:via-white/12"
              aria-hidden
            />
            <FadeIn>
              <MotionScreenshot>
                <div className="relative z-10 mx-auto flex w-full justify-center px-2">
                  <MotionPreviewFrame emphasis="standard" className="w-full max-w-[min(100%,64rem)]">
                    <TrainingIframePair
                      className="w-full max-w-[min(100%,64rem)]"
                      title="PatternForge — desktop workspace, same training pass (cycle 3)"
                      preview={CONTINUE_ANYWHERE_DESKTOP_PREVIEW}
                    />
                  </MotionPreviewFrame>
                </div>
              </MotionScreenshot>
            </FadeIn>
            <FadeIn delay={0.1}>
              <MotionScreenshot className="absolute bottom-0 right-[max(0.5rem,2%)] z-20 w-[min(94%,17.5rem)] origin-bottom-right scale-[0.88] xl:bottom-2 xl:right-[max(1rem,3%)] xl:scale-[0.9]">
                <div className="overflow-hidden rounded-[1.85rem] shadow-[0_22px_48px_-14px_rgba(0,0,0,0.48)] ring-1 ring-border/40 dark:shadow-[0_26px_56px_-16px_rgba(0,0,0,0.65)] dark:ring-border/35">
                  <MotionPreviewFrame emphasis="ambient" className="block">
                    <TrainingIframePair
                      className="w-full"
                      title="PatternForge — continue the same training pass on mobile (cycle 3)"
                      preview={CONTINUE_ANYWHERE_MOBILE_PREVIEW}
                      phoneShellClassName="max-w-full lg:max-w-[17.5rem] lg:w-[17.5rem]"
                      phoneAspectClassName="aspect-[430/640]"
                      smAspectHeight={640}
                      smFillContainer={false}
                      compactHeroLayout
                      preventShortEmbedFrame
                    />
                  </MotionPreviewFrame>
                </div>
              </MotionScreenshot>
            </FadeIn>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[9.5rem] bg-gradient-to-t from-muted/[0.06] to-transparent dark:from-muted/[0.05]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[8%] bottom-0 z-[1] mx-auto h-px max-w-[76rem] bg-gradient-to-r from-transparent via-border/28 to-transparent dark:via-white/8"
      />
    </section>
  );
}
