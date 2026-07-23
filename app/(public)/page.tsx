import type { Metadata } from "next";

import { CTASection } from "@/shared/components/sections/cta";
import { FeaturesSection } from "@/shared/components/sections/features";
import { GridSection } from "@/shared/components/sections/grid-section";
import { HeroChatFinderSection } from "@/shared/components/sections/hero-chat-finder";
import { HeroSection } from "@/shared/components/sections/hero";
import { ProjectMarqueeSection } from "@/shared/components/sections/project-marquee";

import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { PRODUCT_STATUS } from "@/modules/catalog/domain";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { getSiteSettingsAction } from "@/modules/settings/presentation/actions";

import { unwrapActionResult } from "@/shared/lib/action-result";
import { BASE_URL } from "@/shared/lib/seo-schema";

// Every other page in the app sets its own alternates.canonical — the
// homepage was the one exception (root layout.tsx's metadata has none),
// so it had no canonical tag at all.
export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
};

async function getCachedHomeData() {
  const [settingsData, projects, categories, contacts, brands] =
    await Promise.all([
      getSiteSettingsAction().then(unwrapActionResult),
      getProjectsAction({
        isPublished: true,
        limit: 200,
      }).then(unwrapActionResult),
      getCategoriesAction().then(unwrapActionResult),
      getContactsAction().then(unwrapActionResult),
      getBrandsAction({ limit: 100 }).then(unwrapActionResult),
    ]);

  // Convert settings array to a more usable object
  const settings: Record<string, string> = {};
  settingsData?.forEach((item) => {
    settings[item.key] = item.value || "";
  });

  // Fetch products for each category in parallel
  // limit: 12 = highly divisible for responsive grids (2, 3, 4, 6 columns)
  const categoriesWithProducts = await Promise.all(
    (categories || []).map(async (category) => {
      const { data: products, totalCount } = await getProductsAction({
        status: PRODUCT_STATUS.PUBLISHED,
        categoryId: category.id,
        limit: 12,
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
  };
}

export default async function Home() {
  const { settings, projects, categoriesWithProducts, contacts, brands } =
    await getCachedHomeData();

  const otherProjects = (projects || [])
    .filter((p) => !p.isFeatured)
    .slice(0, 8);

  const categorySections = (categoriesWithProducts || []).map((catData, idx) => ({
    id: `category-${catData.category.slug}`,
    className: "",
    // The first category section sits directly under HeroChatFinderSection
    // (not a GridSection itself, so its own boundary line has no diamond
    // markers to begin with) — showing them only on this one junction read
    // as a stray leftover rather than a deliberate divider.
    showDiamond: idx !== 0,
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

  // Render layout sections
  return (
    <>
      <main className="w-full flex flex-col mt-0 mb-0">
        {/* id read by useIsOverHero — the header (and sticky contact pill)
            stay in their "floating over a dark hero" look for exactly this
            combined region (Hero + chat finder, both full-viewport dark
            sections), not a fixed pixel guess that only ever covered one of
            them. */}
        <div id="hero-chat-region">
          <HeroSection contacts={contacts || []} brands={brands || []} />
          <HeroChatFinderSection />
        </div>
        {sections.map((section) => (
          <GridSection
            key={section.id}
            id={section.id}
            className={section.className}
            isFirst={false}
            showDiamond={section.showDiamond}
          >
            {section.component}
          </GridSection>
        ))}
      </main>
    </>
  );
}
