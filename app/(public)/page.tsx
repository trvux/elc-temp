import { HeroSection } from "@/components/sections/hero";
import { FeaturesSection } from "@/components/sections/features";
import { ShowcaseSection } from "@/components/sections/showcase";
import { CTASection } from "@/components/sections/cta";

export default function Home() {
  return (
    <main className="relative flex flex-col items-center">
      {/* Hero Section */}
      <HeroSection />

      {/* Features/Services Section */}
      <FeaturesSection />

      {/* Projects/Showcase Section */}
      <ShowcaseSection />

      {/* Partners/Trust Section (Optional, could add later) */}
      
      {/* CTA Section */}
      <CTASection />

      {/* Bottom Spacer */}
      <div className="h-24 w-full" />
    </main>
  );
}
