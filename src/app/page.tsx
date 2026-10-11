import { LandingNavbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { CtaSection, LandingFooter } from "@/components/landing/cta";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <LandingNavbar />
      <Hero />
      <HowItWorks />
      <FeaturesGrid />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
