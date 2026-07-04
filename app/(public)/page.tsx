import { BrandShowcase } from "@/shared/components/sections/brand-showcase";
import { CTASection } from "@/shared/components/sections/cta";
import { FeaturesSection } from "@/shared/components/sections/features";
import { GridSection } from "@/shared/components/sections/grid-section";
import { HeroSection } from "@/shared/components/sections/hero";
import { ProjectMarqueeSection } from "@/shared/components/sections/project-marquee";

import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { searchProducts } from "@/modules/catalog/application";
import { productRepo } from "@/modules/catalog/infrastructure/SupabaseProductRepository";
import { getCategories } from "@/modules/category/application";
import { categoryRepo } from "@/modules/category/infrastructure/categoryRepo";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getProjects } from "@/modules/project/application";
import { projectRepo } from "@/modules/project/infrastructure/projectRepo";
import { getSiteSettingsAction } from "@/modules/settings/presentation/actions";

import { generateHomeSchema, generateSystemPageMetadata } from "@/shared/lib/seo-utils";
import { getCachedSystemPage } from "@/shared/lib/cached-system-page";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const systemPage = await getCachedSystemPage("home");
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
  cacheTag("products-list", "projects-list", "brands", "layout", "categories");
  setUseStaticClient(true);

  // Fetch all necessary data for the homepage using the application layer
  const [settingsData, projects, categories, contacts, brands, branches] =
    await Promise.all([
      getSiteSettingsAction().then((res) => res.data),
      getProjects(projectRepo, {
        isPublished: true,
        limit: 200,
      }),
      getCategories(categoryRepo),
      getContactsAction().then((res) => res.data),
      getBrandsAction({ limit: 100 }).then((res) => res.data),
      getBranchesAction({ isPublished: true }).then((res) => res.data),
    ]);

  // Neu Go API chua san sang (contacts va brands deu rong), cache ngan 30s de retry nhanh.
  // contacts va brands la data tu Go API -- neu ca 2 rong la dau hieu Go API chua san sang.
  const isGoApiReady = (contacts && contacts.length > 0) || (brands && brands.length > 0);
  if (!isGoApiReady) {
    cacheLife({ revalidate: 30, expire: 60 });
  } else {
    cacheLife("days");
  }

  // Convert settings array to a more usable object
  const settings: Record<string, string> = {};
  settingsData?.forEach((item) => {
    settings[item.key] = item.value || "";
  });

  // Fetch products for each category in parallel
  // limit: 10 = mobile minimum (2cols × 5rows); client auto-fills to device target
  const categoriesWithProducts = await Promise.all(
    (categories || []).map(async (category) => {
      const { products, totalCount } = await searchProducts(productRepo, "", {
        isPublished: true,
        categoryId: category.id,
        limit: 10,
        offset: 0,
      });
      return {
        category,
        products,
        totalCount,
      };
    })
  );

  // Only keep categories that have products
  const activeCategoriesWithProducts = categoriesWithProducts.filter(
    (item) => item.products && item.products.length > 0
  );

  return {
    settings,
    projects,
    categoriesWithProducts: activeCategoriesWithProducts,
    contacts,
    brands,
    branches,
  };
}

export default async function Home() {
  const { settings, projects, categoriesWithProducts, contacts, brands, branches } =
    await getCachedHomeData();

  const otherProjects = (projects || [])
    .filter((p) => !p.isFeatured)
    .slice(0, 8);

  const categorySections = (categoriesWithProducts || []).map((catData, idx) => ({
    id: `category-${catData.category.slug}`,
    className: "",
    showDiamond: true,
    component: (
      <FeaturesSection
        title={catData.category.name}
        slug={catData.category.slug}
        products={catData.products || []}
        categoryId={catData.category.id}
        totalCount={catData.totalCount}
        priorityCount={idx === 0 ? 4 : 0}
      />
    ),
  }));

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
      id: "brand",
      className: "",
      showDiamond: true,
      component: <BrandShowcase brands={brands || []} />,
    },
    ...categorySections,
    {
      id: "project-marquee",
      className: "",
      showDiamond: true,
      component: (
        <ProjectMarqueeSection
          projects={projects?.filter((p) => p.isFeatured) || []}
          title="Dự án tiêu biểu nổi bật"
        />
      ),
    },
    // Featured projects only cover a handful of the catalog — the rest previously
    // had almost no internal link into them from anywhere but /du-an's own listing.
    // This surfaces the next-most-recent non-featured projects too.
    ...(otherProjects.length > 0
      ? [
          {
            id: "project-marquee-more",
            className: "",
            showDiamond: true,
            component: (
              <ProjectMarqueeSection
                projects={otherProjects}
                title="Dự án khác đã thực hiện"
              />
            ),
          },
        ]
      : []),
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

  // Render layout sections
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeSchema),
        }}
      />
      <main className="w-full flex flex-col mt-0 mb-0">
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
    </>
  );
}
