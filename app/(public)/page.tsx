import { BrandShowcase } from "@/shared/components/sections/brand-showcase";
import { CTASection } from "@/shared/components/sections/cta";
import { FeaturesSection } from "@/shared/components/sections/features";
import { HeroSection } from "@/shared/components/sections/hero";
import { HeroMediaSection } from "@/shared/components/sections/hero-media";
import { ShowcaseSection } from "@/shared/components/sections/showcase";
import { StickyContactActions } from "@/shared/components/sections/sticky-contact-actions";

import { getProducts } from "@/modules/catalog/application";
import { getContacts } from "@/modules/contact/application";
import { getProjects } from "@/modules/project/application";
import { getSiteSettings } from "@/modules/settings/application";

import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Điện máy ELC - Siêu thị máy lạnh & Giải pháp không khí chính hãng, giá tốt",
  description:
    "Điện máy ELC - Hệ thống cung cấp máy lạnh chính hãng, máy lọc không khí và giải pháp điều hòa trung tâm VRV/VRF. Cam kết giá rẻ nhất thị trường, lắp đặt chuyên nghiệp, bảo hành dài hạn.",
  openGraph: {
    title: "Điện máy ELC - Máy lạnh chính hãng, giá tốt nhất",
    description:
      "Hệ thống điện máy chuyên cung cấp máy lạnh, máy lọc khí và giải pháp không khí cho gia đình, dự án. Uy tín, chất lượng.",
    images: ["/images/hero-bg.jpg"],
  },
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
        limit: 100,
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
      className: "", // bg-background text-foreground dark
      component: (
        <HeroSection
          title={settings.hero_title}
          subtitle={settings.hero_subtitle}
          contacts={contacts || []}
        />
      ),
    },
    {
      id: "hero-media",
      className: "",
      component: <HeroMediaSection image={settings.hero_image} />,
    },
    { id: "brand", className: "", component: <BrandShowcase /> },
    {
      id: "showcase",
      className: "", // bg-background text-foreground dark
      component: <ShowcaseSection projects={projects || []} />,
    },
    {
      id: "features",
      className: "",
      component: <FeaturesSection products={featuredProducts || []} />,
    },
    {
      id: "cta",
      className: "", // bg-background text-foreground dark
      component: <CTASection settings={settings} contacts={contacts || []} />,
    },
  ];

  return (
    <>
      <main className="w-full flex flex-col gap-6 md:gap-8 lg:gap-10 xl:gap-12 py-8 md:py-12 lg:py-16 xl:py-20 animate-fade-in-up">
        {sections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            className={`w-full ${section.className || ""}`}
          >
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
              {section.component}
            </div>
          </div>
        ))}
      </main>
      <StickyContactActions contacts={contacts || []} />
    </>
  );
}
