import { MarketingFooter } from "@/components/marketing/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing/components/marketing-header";
import { HomeLocalFirstTrainingSection } from "@/components/marketing/sections/home-local-first-section";
import { HomeFinalCtaSection } from "@/components/marketing/sections/home-final-cta-section";
import { HomeHeroSection } from "@/components/marketing/sections/home-hero-section";
import { HomeMethodSection } from "@/components/marketing/sections/home-method-section";
import { HomeTimeCompressionSection } from "@/components/marketing/sections/home-time-compression-section";
import { HomeTrainingLoopSection } from "@/components/marketing/sections/home-training-loop-section";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <MarketingHeader />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden">
        <main className="relative flex-1 isolate">
          <HomeHeroSection />
          <HomeTrainingLoopSection />
          <HomeMethodSection />
          <HomeTimeCompressionSection />
          <HomeLocalFirstTrainingSection />
          <HomeFinalCtaSection />
        </main>
        <MarketingFooter />
      </div>
    </div>
  );
}
