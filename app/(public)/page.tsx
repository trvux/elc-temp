import { BrandShowcase } from "@/shared/components/sections/brand-showcase";
import { CTASection } from "@/shared/components/sections/cta";
import { FeaturesSection } from "@/shared/components/sections/features";
import { HeroSection } from "@/shared/components/sections/hero";
import { ShowcaseSection } from "@/shared/components/sections/showcase";
import { Separator } from "@/shared/components/ui/separator";

import { getSiteSettings } from "@/modules/settings/application";
import { getProjects } from "@/modules/project/application";
import { getProducts } from "@/modules/catalog/application";
import { getContacts } from "@/modules/contact/application";

export const revalidate = 3600;

export default async function Home() {
  // Fetch all necessary data for the homepage using the application layer
  const [
    settingsData,
    projects,
    featuredProducts,
    contacts,
  ] = await Promise.all([
    getSiteSettings(),
    getProjects({ 
      isPublished: true, 
      limit: 5 
    }),
    getProducts({ 
      isPublished: true, 
      isFeatured: true, 
      limit: 12 
    }),
    getContacts(),
  ]);

  // Convert settings array to a more usable object
  const settings: Record<string, string> = {};
  settingsData?.forEach((item) => {
    settings[item.key] = item.value || "";
  });

  return (
    <main className="px-4 md:px-6 lg:px-8 space-y-16 md:space-y-24">
      <HeroSection
        title={settings.hero_title}
        subtitle={settings.hero_subtitle}
        ctaText={settings.hero_cta_text}
        ctaUrl={settings.hero_cta_url}
        image={settings.hero_image}
        contacts={contacts || []}
      />
      <Separator />

      <BrandShowcase />
      <Separator />

      <ShowcaseSection projects={projects || []} />
      <Separator />

      <FeaturesSection products={featuredProducts || []} />
      <Separator />

      <CTASection settings={settings} contacts={contacts || []} />
      <Separator />
    </main>
  );
}
