"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AppearanceTab } from "@/components/appearance-tab";
import { AuthDialog } from "@/components/auth-dialog";
import { PageLoader } from "@/components/page-loader";
import { HeroSection } from "@/components/sections/hero";
import { ProblemPatternsSection } from "@/components/sections/problem-patterns";
import { FeaturesSection } from "@/components/sections/features";
import { WorkflowSection } from "@/components/sections/workflow";
import { ScreenshotsSection } from "@/components/sections/screenshots";
import { BenefitsSection } from "@/components/sections/benefits";
import { PricingSection } from "@/components/sections/pricing";
import { DocumentationCardsSection } from "@/components/sections/documentation-cards";
import { PhilosophySection } from "@/components/sections/philosophy";
import { FaqSection } from "@/components/sections/faq";
import { FinalCtaSection } from "@/components/sections/final-cta";

export default function Home() {
  return (
    <>
      <PageLoader />
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1">
          <HeroSection />
          <ProblemPatternsSection />
          <FeaturesSection />
          <WorkflowSection />
          <ScreenshotsSection />
          <BenefitsSection />
          <PricingSection />
          <DocumentationCardsSection />
          <PhilosophySection />
          <FaqSection />
          <FinalCtaSection />
        </main>
        <SiteFooter />
      </div>
      <AppearanceTab />
      <AuthDialog />
    </>
  );
}
