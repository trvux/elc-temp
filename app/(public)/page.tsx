import { BrandShowcase } from "@/shared/components/sections/brand-showcase";
import { CTASection } from "@/shared/components/sections/cta";
import { FeaturesSection } from "@/shared/components/sections/features";
import { GridSection } from "@/shared/components/sections/grid-section";
import { HeroSection } from "@/shared/components/sections/hero";
import { HeroMediaSection } from "@/shared/components/sections/hero-media";
import { ProjectMarqueeSection } from "@/shared/components/sections/project-marquee";
import { ShowcaseSection } from "@/shared/components/sections/showcase";
import { StickyContactActions } from "@/shared/components/sections/sticky-contact-actions";

import { getBranches } from "@/modules/branch/application";
import { branchRepo } from "@/modules/branch/infrastructure/branchRepo";
import { getBrands } from "@/modules/brand/application";
import { brandRepo } from "@/modules/brand/infrastructure/brandRepo";
import { getProducts } from "@/modules/catalog/application";
import { productRepo } from "@/modules/catalog/infrastructure/SupabaseProductRepository";
import { getContacts } from "@/modules/contact/application";
import { contactRepo } from "@/modules/contact/infrastructure";
import { getProjects } from "@/modules/project/application";
import { projectRepo } from "@/modules/project/infrastructure/projectRepo";
import { getSiteSettings } from "@/modules/settings/application";
import { settingsRepo } from "@/modules/settings/infrastructure/settingsRepo";

import { generateHomeSchema, generateSystemPageMetadata } from "@/shared/lib/seo-utils";
import { Metadata } from "next";
import { getSystemPageBySlug } from "@/modules/system-page/application";
import { systemPageRepo } from "@/modules/system-page/infrastructure/SupabaseSystemPageRepository";

export async function generateMetadata(): Promise<Metadata> {
  const systemPage = await getSystemPageBySlug(systemPageRepo, "home");
  return generateSystemPageMetadata(
    systemPage,
    "Điện máy ELC | Máy lạnh, Hệ thống khí tươi & Dự án trọn gói",
    "Điện máy ELC chuyên cung cấp, lắp đặt & thi công máy lạnh, hệ thống khí tươi chính hãng. Đầy đủ dịch vụ: bảo trì, cho thuê, thu cũ đổi mới uy tín hàng đầu.",
    ""
  ) as Metadata;
}

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
      getSiteSettings(settingsRepo),
      getProjects(projectRepo, {
        isPublished: true,
        limit: 200,
      }),
      getProducts(productRepo, {
        isPublished: true,
        isFeatured: true,
        limit: 12,
      }),
      getContacts(contactRepo),
      getBrands(brandRepo, { limit: 100 }),
      getBranches(branchRepo, { isPublished: true }),
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
          projects={projects?.filter((p) => p.isFeatured) || []}
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

  const homeSchema = generateHomeSchema(
    settings,
    contacts || [],
    branches || [],
  );

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
