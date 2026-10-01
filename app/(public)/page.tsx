import type { Metadata } from "next";

import { CTASection } from "@/shared/components/organisms/sections/cta";
import { FeaturesSection } from "@/shared/components/organisms/sections/features";
import { HeroSection } from "@/shared/components/organisms/sections/hero";
import { NewsTeaserSection } from "@/shared/components/organisms/sections/news-teaser";
import { ProjectBounceCardsSection } from "@/shared/components/organisms/sections/project-bounce-cards";
import { ServicesTeaserSection } from "@/shared/components/organisms/sections/services-teaser";

import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { PRODUCT_STATUS } from "@/modules/catalog/domain";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getNewsAction } from "@/modules/news/presentation/actions";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { getPublishedServicesGroupedAction } from "@/modules/service/presentation/actions";
import { getSiteSettingsAction } from "@/modules/settings/presentation/actions";

import { unwrapActionResult } from "@/shared/lib/action-result";
import { BASE_URL } from "@/shared/lib/seo-schema";

// Homepage used to only set canonical here and inherit title/description
// straight from app/layout.tsx's site-wide default — "Mua Bán, Thi Công,
// Dịch Vụ Máy Lạnh & Khí Tươi | Điện Máy ELC". That string is near-identical
// to /san-pham's own title ("Máy lạnh, hệ thống khí tươi, máy lọc nước
// chính hãng..."), so Google saw two pages both claiming the same "máy
// lạnh / khí tươi / lọc nước" topic. Confirmed via GSC cannibalization
// audit (seo-audit/data/cannibalization_audit_2026-09-21.md): for broad
// product queries ("máy lạnh", "vệ sinh máy lạnh"...) Google picked the
// homepage as the "default answer" over /san-pham for ~90% of affected
// impressions, at a much worse position — classic symptom of two pages
// with duplicate title/description signals, where the higher-authority
// one (homepage) wins by default instead of the actually-relevant one.
// /dich-vu and /du-an don't have this problem because each already
// declares its own distinct, keyword-specific metadata instead of
// inheriting the root layout's. This gives the homepage the same
// treatment: brand/positioning-led (matches the real on-page H1 below,
// "Đối Tác Điện Lạnh Trọn Gói"), deliberately NOT repeating the
// "máy lạnh / khí tươi / lọc nước" keyword triad so /san-pham (and
// /dich-vu, /du-an) keep sole ownership of their own commercial keywords.
export const metadata: Metadata = {
  title: "Điện Máy ELC - Đối Tác Điện Lạnh Trọn Gói Tại Việt Nam",
  description:
    "Điện Máy ELC là đối tác điện lạnh trọn gói: phân phối sản phẩm chính hãng, thi công công trình A-Z và dịch vụ bảo trì chuyên nghiệp cho khách hàng dân dụng & doanh nghiệp.",
  openGraph: {
    title: "Điện Máy ELC - Đối Tác Điện Lạnh Trọn Gói Tại Việt Nam",
    description:
      "Điện Máy ELC là đối tác điện lạnh trọn gói: phân phối sản phẩm chính hãng, thi công công trình A-Z và dịch vụ bảo trì chuyên nghiệp cho khách hàng dân dụng & doanh nghiệp.",
    url: BASE_URL,
  },
  twitter: {
    title: "Điện Máy ELC - Đối Tác Điện Lạnh Trọn Gói Tại Việt Nam",
    description:
      "Điện Máy ELC là đối tác điện lạnh trọn gói: phân phối sản phẩm chính hãng, thi công công trình A-Z và dịch vụ bảo trì chuyên nghiệp cho khách hàng dân dụng & doanh nghiệp.",
  },
  alternates: { canonical: BASE_URL },
};

// How many items each of the 4 vertical teasers (sản phẩm/category, dịch
// vụ, tin tức) shows on the homepage — deliberately small. The homepage's
// job is to be the hub that sends visitors INTO /san-pham, /dich-vu,
// /tin-tuc, /du-an, not to mirror each one's full listing here. Before
// this, the product section alone rendered every category's full first
// page (limit 12) with its own infinite "load more", making the homepage a
// near-duplicate of /san-pham in both signal (see the metadata comment
// above) and actual on-page content — this keeps the flywheel (each
// vertical reinforcing the others via links) without the duplication.
const TEASER_ITEM_LIMIT = 6;

async function getCachedHomeData() {
  const [settingsData, projects, categories, contacts, brands, groupedServices, news] =
    await Promise.all([
      getSiteSettingsAction().then(unwrapActionResult),
      getProjectsAction({
        isPublished: true,
        limit: 200,
      }).then(unwrapActionResult),
      getCategoriesAction().then(unwrapActionResult),
      getContactsAction().then(unwrapActionResult),
      getBrandsAction({ limit: 100 }).then(unwrapActionResult),
      getPublishedServicesGroupedAction(),
      getNewsAction({
        isPublished: true,
        limit: TEASER_ITEM_LIMIT / 2,
        sortBy: "created_at",
        sortOrder: "desc",
      }).then(unwrapActionResult),
    ]);

  // Convert settings array to a more usable object
  const settings: Record<string, string> = {};
  settingsData?.forEach((item) => {
    settings[item.key] = item.value || "";
  });

  // Fetch a small teaser batch per category in parallel — see
  // TEASER_ITEM_LIMIT above for why this is no longer the full first page.
  const categoriesWithProducts = await Promise.all(
    (categories || []).map(async (category) => {
      const { data: products, totalCount } = await getProductsAction({
        status: PRODUCT_STATUS.PUBLISHED,
        categoryId: category.id,
        limit: TEASER_ITEM_LIMIT,
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

  const services = (groupedServices || [])
    .flatMap((group) => group.items)
    .slice(0, 3);

  return {
    settings,
    projects,
    categoriesWithProducts: activeCategoriesWithProducts,
    contacts,
    brands,
    services,
    news: news || [],
  };
}

export default async function Home() {
  const { settings, projects, categoriesWithProducts, contacts, brands, services, news } =
    await getCachedHomeData();

  // No `categoryId` prop here (unlike /san-pham's own sections) — that's
  // what lets FeaturesSection's "load more" stay off, so this section is a
  // bounded teaser instead of growing into a full duplicate listing.
  const categorySections = (categoriesWithProducts || []).map((catData, idx) => ({
    id: `category-${catData.category.slug}`,
    component: (
      <FeaturesSection
        title={catData.category.name}
        slug={catData.category.slug}
        products={catData.products || []}
        totalCount={catData.totalCount}
        priorityCount={idx === 0 ? 4 : 0}
      />
    ),
  }));

  const sections = [
    ...categorySections,
    {
      id: "project-marquee",
      component: (
        <ProjectBounceCardsSection
          projects={(projects || []).filter((p) => p.isFeatured)}
          title="Dự án tiêu biểu nổi bật"
        />
      ),
    },
    {
      id: "services-teaser",
      component: <ServicesTeaserSection services={services} />,
    },
    {
      id: "news-teaser",
      component: <NewsTeaserSection news={news} />,
    },
    {
      id: "cta",
      component: <CTASection settings={settings} contacts={contacts || []} />,
    },
  ];

  // Render layout sections
  return (
    <>
      <main className="w-full flex flex-col mt-0 mb-0">
        {/* id read by useIsOverHero — the header (and sticky contact pill)
            stay in their "floating over a dark hero" look for exactly this
            region, not a fixed pixel guess. */}
        <div id="hero-chat-region">
          <HeroSection brands={brands || []} />
        </div>
        {/* Section separation is now pure spacing, no divider/diamond — see
            grid-section.tsx's own removal comment (2026-09-24) for why. */}
        {sections.map((section) => (
          <div key={section.id} id={section.id} className="w-full relative">
            <div className="mx-auto h-full w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-12 relative py-12 md:py-20 lg:py-32">
              {section.component}
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
