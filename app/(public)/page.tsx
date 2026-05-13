import { BrandShowcase } from "@/shared/components/sections/brand-showcase";
import { CTASection } from "@/shared/components/sections/cta";
import { FeaturesSection } from "@/shared/components/sections/features";
import { HeroSection } from "@/shared/components/sections/hero";
import { ShowcaseSection } from "@/shared/components/sections/showcase";
import { StickyContactActions } from "@/shared/components/sections/sticky-contact-actions";

import { getProducts } from "@/modules/catalog/application";
import { getContacts } from "@/modules/contact/application";
import { getProjects } from "@/modules/project/application";
import { getSiteSettings } from "@/modules/settings/application";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điện máy ELC | Máy lạnh & Giải pháp không khí chuyên nghiệp, giá tốt",
  description: "Điện máy ELC - Chuyên cung cấp máy lạnh chính hãng, hệ thống VRV/VRF và máy lọc không khí. Cam kết giá tốt nhất thị trường, lắp đặt chuyên nghiệp, bảo trì tận tâm.",
  openGraph: {
    title: "Điện máy ELC - Máy lạnh chính hãng, giá tốt nhất",
    description: "Chuyên máy lạnh, máy lọc khí và giải pháp không khí cho gia đình, dự án. Lắp đặt nhanh, uy tín.",
    images: ["/images/hero-bg.jpg"],
  }
};

export const revalidate = 3600;

export default async function Home() {
  // Fetch all necessary data for the homepage using the application layer
  const [settingsData, projects, featuredProducts, contacts] =
    await Promise.all([
      getSiteSettings(),
      getProjects({
        isPublished: true,
        isFeatured: true,
        limit: 5,
      }),
      getProducts({
        isPublished: true,
        isFeatured: true,
        limit: 12,
      }),
      getContacts(),
    ]);

  // Convert settings array to a more usable object
  const settings: Record<string, string> = {};
  settingsData?.forEach((item) => {
    settings[item.key] = item.value || "";
  });

  const sections = [
    {
      id: "hero",
      component: (
        <HeroSection
          title={settings.hero_title}
          subtitle={settings.hero_subtitle}
          image={settings.hero_image}
          contacts={contacts || []}
        />
      ),
    },
    { id: "brand", component: <BrandShowcase /> },
    {
      id: "showcase",
      component: <ShowcaseSection projects={projects || []} />,
    },
    {
      id: "features",
      component: <FeaturesSection products={featuredProducts || []} />,
    },
    {
      id: "cta",
      component: <CTASection settings={settings} contacts={contacts || []} />,
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      {sections.map((section) => (
        <div key={section.id} id={section.id} className="py-12 md:py-24">
          {section.component}
        </div>
      ))}
      <StickyContactActions contacts={contacts || []} />
    </main>
  );
}
