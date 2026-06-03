import { BrandShowcase } from "@/shared/components/sections/brand-showcase";
import { CTASection } from "@/shared/components/sections/cta";
import { FeaturesSection } from "@/shared/components/sections/features";
import { HeroSection } from "@/shared/components/sections/hero";
import { HeroMediaSection } from "@/shared/components/sections/hero-media";
import { ProjectMarqueeSection } from "@/shared/components/sections/project-marquee";
import { ShowcaseSection } from "@/shared/components/sections/showcase";
import { GridSection } from "@/shared/components/sections/grid-section";
import { StickyContactActions } from "@/shared/components/sections/sticky-contact-actions";

import { getProducts } from "@/modules/catalog/application";
import { getContacts } from "@/modules/contact/application";
import { getProjects } from "@/modules/project/application";
import { getSiteSettings } from "@/modules/settings/application";
import { getBrands } from "@/modules/brand/application";

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

import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife, cacheTag } from "next/cache";

async function getCachedHomeData() {
  "use cache";
  cacheLife({ stale: 0, revalidate: 300, expire: 86400 });
  cacheTag("products", "projects", "brands");
  setUseStaticClient(true);

  // Fetch all necessary data for the homepage using the application layer
  const [settingsData, projects, featuredProducts, contacts, brands] =
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
      getBrands({ limit: 100 }),
    ]);

  // Convert settings array to a more usable object
  const settings: Record<string, string> = {};
  settingsData?.forEach((item) => {
    settings[item.key] = item.value || "";
  });

  return {
    settings,
    projects,
    featuredProducts,
    contacts,
    brands,
  };
}

export default async function Home() {
  const { settings, projects, featuredProducts, contacts, brands } =
    await getCachedHomeData();

  const sections = [
    {
      id: "hero",
      className: "", // bg-background text-foreground dark
      showDiamond: true,
      component: (
        <HeroSection
          title={settings.hero_title}
          subtitle={settings.hero_subtitle}
          contacts={contacts || []}
        />
      ),
    },
    {
      id: "project-marquee",
      className: "",
      showDiamond: true,
      component: (
        <ProjectMarqueeSection
          projects={projects || []}
          title="Dự án tiêu biểu nổi bật"
          description="Xem qua các dự án điều hòa trung tâm và lọc khí tươi tiêu biểu đã được ELC thi công hoàn thiện."
        />
      ),
    },
    {
      id: "hero-media",
      className: "",
      showDiamond: true,
      component: (
        <HeroMediaSection
          title="Trải nghiệm không gian sống lý tưởng"
          description="Khám phá hình ảnh của hệ thống điều khí thông minh và các giải pháp tối ưu từng nhịp thở cho ngôi nhà."
        />
      ),
    },
    { id: "brand", className: "", showDiamond: true, component: <BrandShowcase brands={brands || []} /> },

    {
      id: "features",
      className: "",
      showDiamond: true,
      component: <FeaturesSection products={featuredProducts || []} />,
    },
    {
      id: "showcase",
      className: "", // bg-background text-foreground dark
      showDiamond: true,
      component: <ShowcaseSection projects={projects || []} />,
    },
    {
      id: "cta",
      className: "", // bg-background text-foreground dark
      showDiamond: true,
      component: <CTASection settings={settings} contacts={contacts || []} />,
    },
  ];

  return (
    <>
      <main className="w-full flex flex-col animate-fade-in-up mt-0 mb-0">
        {sections.map((section, index) => (
          <GridSection
            key={section.id}
            id={section.id}
            className={section.className}
            isFirst={index === 0}
            showDiamond={section.showDiamond}
          >
            {section.component}
          </GridSection>
        ))}
      </main>
      <StickyContactActions contacts={contacts || []} />
    </>
  );
}
