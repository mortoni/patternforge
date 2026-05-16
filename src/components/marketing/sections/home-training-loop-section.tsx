import {
  AmbientBreathOrb,
  MotionCard,
  MotionPreviewFrame,
  StaggerContainer,
  StaggeredSectionHeader,
} from "@/components/shared/motion-primitives";
import {
  DocumentThemedMasteryMarketingPreview,
  DocumentThemedProgressMarketingPreview,
} from "@/features/marketing/components/training-in-action-flow-previews";
import { cn } from "@/lib/utils";
import { TrainingIframePair } from "@/components/marketing/components/training-iframe-pair";
import { trainingInActionCards } from "@/components/marketing/home-landing-data";

export function HomeTrainingLoopSection() {
  return (
    <section
      id="philosophy"
      className={cn(
        "relative w-full scroll-mt-4 bg-gradient-to-b from-muted/[0.105] via-background via-[42%] to-background px-3.5 pt-11 pb-[4.75rem] dark:from-muted/[0.078] dark:via-background sm:px-5 sm:pt-12 sm:pb-[5rem] md:px-6 md:pt-14 md:pb-28 lg:px-10",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[min(9rem,20vh)] before:bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,color-mix(in_oklab,var(--muted-foreground)_4%,transparent),transparent_74%)] before:opacity-70 dark:before:opacity-85"
      )}
      aria-labelledby="training-in-action-heading"
    >
      <div id="training-in-action" />
      <AmbientBreathOrb
        emphasis="section"
        className="pointer-events-none absolute left-1/2 top-[48%] hidden h-[min(380px,44vh)] w-[min(880px,92vw)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_48%_36%_at_50%_44%,color-mix(in_oklab,var(--primary)_5.5%,transparent),transparent_72%)] lg:block"
      />
      <div className="relative z-[1] mx-auto max-w-[min(100%,88rem)]">
        <StaggeredSectionHeader
          headingId="training-in-action-heading"
          eyebrow="TRAINING LOOP"
          eyebrowClassName="tracking-[0.11em] text-muted-foreground/55"
          title="Train. Repeat. Recognize faster."
          body="Repetition turns calculation into recognition."
          className="max-w-2xl [&_p]:max-w-xl [&_p]:text-pretty [&_p]:text-[0.9375rem] [&_p]:leading-relaxed [&_p]:text-muted-foreground/85 sm:[&_p]:text-base"
        />

        <div className="relative mx-auto mt-9 max-w-[min(100%,86rem)] sm:mt-10 md:mt-11 lg:mt-12">
          <StaggerContainer
            as="ul"
            className="relative z-10 grid grid-cols-1 gap-11 sm:gap-12 lg:grid-cols-3 lg:items-start lg:gap-x-6 lg:gap-y-6 xl:gap-x-8 xl:gap-y-5"
          >
            {trainingInActionCards.map((card) => {
              const isCenter = card.mode === "center";
              const frameWidth =
                card.visual.kind === "phone"
                  ? undefined
                  : isCenter
                    ? "w-[min(100%,23rem)] max-w-[23rem]"
                    : "w-[min(100%,17.75rem)] max-w-[17.75rem]";

              return (
                <MotionCard
                  as="li"
                  key={card.role}
                  y={isCenter ? 20 : 12}
                  duration={isCenter ? 0.55 : 0.42}
                  staggered
                  hover={false}
                  className={cn(
                    "flex min-h-0 min-w-0 w-full flex-col lg:overflow-visible",
                    card.role === "track" &&
                      "lg:opacity-[0.78] lg:transition-opacity lg:duration-500 lg:ease-out lg:hover:opacity-[0.86]",
                    card.role === "solve" &&
                      "lg:z-30 lg:opacity-100 lg:transition-opacity lg:duration-500 lg:ease-out",
                    card.role === "master" &&
                      "lg:opacity-[0.78] lg:transition-opacity lg:duration-500 lg:ease-out lg:hover:opacity-[0.86]"
                  )}
                >
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="shrink-0 space-y-1 sm:space-y-1.5 lg:min-h-[5.25rem]">
                      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/45">
                        {card.step}
                      </p>
                      <h3
                        className={cn(
                          "text-base font-medium leading-snug tracking-tight text-foreground",
                          isCenter && "text-[17px] sm:text-lg"
                        )}
                      >
                        {card.title}
                      </h3>
                      <p className="max-w-[26rem] text-sm leading-snug text-muted-foreground/82 sm:leading-relaxed lg:max-w-none">
                        {card.body}
                      </p>
                    </div>

                    <div
                      className={cn(
                        "mt-4 flex w-full flex-col sm:mt-5 lg:mt-6",
                        isCenter && "lg:translate-y-9"
                      )}
                    >
                      {card.visual.kind === "phone" ? (
                        <div className="flex w-full justify-center">
                          <MotionPreviewFrame
                            emphasis={isCenter ? "hero" : "standard"}
                            className="relative shrink-0"
                          >
                            <TrainingIframePair
                              className="absolute inset-0"
                              title={card.visual.iframeTitle}
                              preview={card.visual.preview}
                              shellTone="muted"
                            />
                          </MotionPreviewFrame>
                        </div>
                      ) : card.visual.kind === "progress" ? (
                        <MotionPreviewFrame
                          emphasis="ambient"
                          className={cn(
                            "marketing-loop-frame relative isolate mx-auto aspect-[430/932] shrink-0",
                            frameWidth
                          )}
                        >
                          <DocumentThemedProgressMarketingPreview
                            title={card.visual.iframeTitle}
                            className="absolute inset-0"
                            shellTone="muted"
                            {...card.visual.preview}
                          />
                        </MotionPreviewFrame>
                      ) : (
                        <MotionPreviewFrame
                          emphasis="standard"
                          className={cn(
                            "marketing-loop-frame relative isolate mx-auto aspect-[430/932] shrink-0",
                            frameWidth
                          )}
                        >
                          <DocumentThemedMasteryMarketingPreview
                            title={card.visual.iframeTitle}
                            className="absolute inset-0"
                            shellTone="muted"
                            {...card.visual.preview}
                          />
                        </MotionPreviewFrame>
                      )}
                    </div>
                  </div>
                </MotionCard>
              );
            })}
          </StaggerContainer>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-40 bg-gradient-to-b from-transparent via-background/25 to-muted/[0.085] dark:via-background/35 dark:to-muted/[0.07]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[5%] bottom-0 z-[2] mx-auto h-px max-w-[76rem] bg-gradient-to-r from-transparent via-border/30 to-transparent dark:via-white/9"
      />
    </section>
  );
}
