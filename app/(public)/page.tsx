import { BrandShowcase } from "@/shared/components/sections/brand-showcase";
import { CTASection } from "@/shared/components/sections/cta";
import { FeaturesSection } from "@/shared/components/sections/features";
import { GridSection } from "@/shared/components/sections/grid-section";
import { HeroSection } from "@/shared/components/sections/hero";
import { HeroMediaSection } from "@/shared/components/sections/hero-media";
import { ProjectMarqueeSection } from "@/shared/components/sections/project-marquee";
import { ShowcaseSection } from "@/shared/components/sections/showcase";
import { StickyContactActions } from "@/shared/components/sections/sticky-contact-actions";

import { getBrands } from "@/modules/brand/application";
import { getProducts } from "@/modules/catalog/application";
import { getContacts } from "@/modules/contact/application";
import { getProjects } from "@/modules/project/application";
import { getSiteSettings } from "@/modules/settings/application";
import { getBranches } from "@/modules/branch/application";

import { Metadata } from "next";
import { generateHomeSchema } from "@/shared/lib/seo-utils";

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
  cacheLife("days");
  cacheTag("products-list", "projects-list", "brands", "layout");
  setUseStaticClient(true);

  // Fetch all necessary data for the homepage using the application layer
  const [settingsData, projects, featuredProducts, contacts, brands, branches] =
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
      getBranches({ isPublished: true }),
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
    branches,
  };
}

export default async function Home() {
  const { settings, projects, featuredProducts, contacts, brands, branches } =
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
          description="Khám phá sự đa dạng của các hệ thống điều hòa không khí do ELC thi công hoàn thiện, bao gồm từ hệ thống điều hòa trung tâm VRV, hệ thống điều hòa Multi, máy lạnh âm trần Cassette, máy lạnh tủ đứng, máy lạnh treo tường, cho đến hệ thống cấp khí tươi thu hồi nhiệt và lọc không khí chuyên nghiệp."
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
          description="Khám phá hệ sinh thái giải pháp toàn diện từ ELC, kết hợp hoàn hảo giữa hệ thống điều hòa không khí, hệ thống cấp khí tươi thu hồi nhiệt và lọc không khí cùng giải pháp nhà thông minh (Smart home) hiện đại, tối ưu hóa từng tiện ích và nhịp thở cho ngôi nhà của bạn."
        />
      ),
    },
    {
      id: "brand",
      className: "",
      showDiamond: true,
      component: <BrandShowcase brands={brands || []} />,
    },

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

  const homeSchema = generateHomeSchema(settings, contacts || [], branches || []);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeSchema),
        }}
      />
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
