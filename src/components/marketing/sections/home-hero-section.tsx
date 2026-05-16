import Link from "next/link";
import {
  AmbientBreathOrb,
  FadeIn,
  HeroCascade,
  MotionPreviewFrame,
} from "@/components/shared/motion-primitives";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TrainingIframePair } from "@/components/marketing/components/training-iframe-pair";
import { MARKETING_HERO_PHONE_PREVIEW } from "@/components/marketing/home-landing-data";
import { heroContainerClass, sectionHairline } from "@/components/marketing/layout-classes";

export function HomeHeroSection() {
  return (
    <section
      className={cn(
        "relative overflow-x-clip overflow-y-visible",
        sectionHairline
      )}
      aria-labelledby="hero-heading"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[14%] h-[46%] w-[58%] max-w-3xl bg-[radial-gradient(ellipse_52%_48%_at_38%_42%,color-mix(in_oklab,var(--muted-foreground)_5%,transparent),transparent_72%)] opacity-40 dark:bg-[radial-gradient(ellipse_52%_48%_at_38%_42%,color-mix(in_oklab,var(--primary)_4%,transparent),transparent_74%)] dark:opacity-55" />
        <div className="absolute right-[-6%] top-[18%] h-[48%] w-[52%] max-w-3xl bg-[radial-gradient(circle_at_56%_42%,rgba(132,104,232,0.042),rgba(132,104,232,0.018)_46%,transparent_74%)] opacity-60 blur-[26px] dark:bg-[radial-gradient(circle_at_56%_42%,rgba(132,104,232,0.08),rgba(132,104,232,0.026)_46%,transparent_74%)] md:right-0" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[min(14rem,30vh)] bg-gradient-to-b from-transparent via-background/42 to-background dark:via-background/58"
      />

      <div
        className={`${heroContainerClass} relative z-[1] py-11 sm:py-14 md:py-16 lg:min-h-[min(78vh,48rem)] lg:py-[clamp(4rem,7vw,5.75rem)] xl:pb-20 xl:pt-[4.375rem]`}
      >
        <div
          className={cn(
            "mx-auto grid w-full min-w-0 gap-9 sm:gap-11 lg:grid-cols-12 lg:items-center lg:gap-x-3 lg:gap-y-10",
            "xl:gap-x-5 xl:gap-y-8"
          )}
        >
          <HeroCascade
            className="min-w-0 justify-self-center text-center max-w-xl sm:max-w-2xl lg:col-span-5 lg:max-w-[min(100%,31rem)] lg:justify-self-start lg:self-center lg:text-left xl:col-span-5"
            title={
              <h1
                id="hero-heading"
                className="text-balance text-[1.625rem] font-light leading-[1.14] tracking-tight text-foreground min-[400px]:text-4xl sm:text-5xl lg:text-[clamp(2.65rem,3.5vw,3.85rem)] xl:text-[clamp(3.1rem,3.4vw,4.2rem)]"
              >
                Train patterns, not just puzzles.
              </h1>
            }
            lead={
              <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base md:text-lg lg:mx-0 lg:mt-3.5 lg:max-w-[28rem] lg:text-[1.0625rem] lg:leading-[1.55]">
                Repeat tactical patterns until the right ideas feel immediate. Recognition sharpens
                through repetition, not an endless stream of unrelated puzzles.
              </p>
            }
            tagline={
              <p className="mx-auto mt-2.5 max-w-xl text-sm italic leading-relaxed text-muted-foreground/85 sm:mt-3 lg:mx-0 lg:max-w-[28rem] lg:text-[0.9375rem] lg:leading-relaxed">
                Over time, calculation gives way to recognition.
              </p>
            }
            actions={
              <div className="mx-auto mt-6 flex w-full max-w-md flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-center sm:gap-3 lg:mx-0 lg:mt-7 lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="w-full min-h-11 transition-[opacity,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-95 hover:-translate-y-px hover:shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--primary)_42%,transparent)] active:translate-y-0 motion-reduce:transform-none motion-reduce:hover:shadow-none sm:w-auto"
                >
                  <Link href={ROUTES.app}>Start training</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full min-h-11 border-border transition-[transform,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-muted/42 hover:-translate-y-px hover:shadow-[0_10px_28px_-14px_color-mix(in_oklab,var(--foreground)_14%,transparent)] active:translate-y-0 motion-reduce:transform-none motion-reduce:hover:shadow-none sm:w-auto"
                >
                  <Link href="#training-in-action">How it works</Link>
                </Button>
              </div>
            }
          />

          <FadeIn
            className="relative flex min-w-0 w-full max-w-full justify-center justify-self-center lg:col-span-7 lg:max-w-none lg:justify-self-stretch"
            delay={0.08}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-[6%] flex w-[104%] max-w-[26rem] -translate-x-1/2 justify-center sm:w-[102%] sm:max-w-[27rem] lg:top-[12%] lg:w-[95%] lg:max-w-[30rem]"
              aria-hidden
            >
              <AmbientBreathOrb
                emphasis="medium"
                className="aspect-[430/932] w-full rounded-full bg-[radial-gradient(circle,rgba(140,92,255,0.12)_0%,rgba(120,75,255,0.04)_42%,transparent_76%)] blur-[28px] dark:bg-[radial-gradient(circle,rgba(160,120,255,0.16)_0%,rgba(120,75,255,0.048)_42%,transparent_76%)]"
              />
            </div>
            <div
              className="pointer-events-none absolute left-1/2 top-[24%] w-[88%] max-w-[20rem] -translate-x-1/2 lg:top-[30%] lg:w-[82%] lg:max-w-[24rem]"
              aria-hidden
            >
              <AmbientBreathOrb
                emphasis="mist"
                className="h-28 w-full rounded-full bg-[radial-gradient(ellipse_80%_52%_at_50%_40%,color-mix(in_oklab,var(--foreground)_4.5%,transparent),transparent_80%)] blur-xl"
              />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-[min(100%,22.5rem)] lg:max-w-[min(104%,29rem)]">
              <div className="w-full max-lg:mx-auto">
                <MotionPreviewFrame
                  emphasis="hero"
                  className="relative z-10 w-full max-md:scale-100"
                >
                  <div className="w-full">
                    <TrainingIframePair
                      className="absolute inset-0"
                      title="Training loop — active exercise preview"
                      preview={MARKETING_HERO_PHONE_PREVIEW}
                    />
                  </div>
                </MotionPreviewFrame>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
