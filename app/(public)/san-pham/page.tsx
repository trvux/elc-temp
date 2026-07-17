import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import {
  CategorySectionsGrid,
  type CategorySectionData,
} from "@/shared/components/layout/user/category-sections-grid";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { RecentlyViewedSection } from "@/shared/components/layout/user/recently-viewed-section";
import { unwrapActionResult } from "@/shared/lib/action-result";
import {
  BASE_URL,
  generateBreadcrumbSchema,
  generateSystemPageMetadata,
  SHOP_NAME,
} from "@/shared/lib/seo-utils";
import { getCachedSystemPage } from "@/shared/lib/cached-system-page";
import { cn } from "@/shared/lib/utils";
import {
  TypographyH1,
  TypographySmall,
} from "@/shared/components/ui/typography";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = `${BASE_URL}/san-pham`;
  const systemPage = await getCachedSystemPage("san-pham");
  const meta = generateSystemPageMetadata(
    systemPage,
    `Máy lạnh & Thiết bị lọc không khí chính hãng | ${SHOP_NAME}`,
    `Khám phá hàng ngàn sản phẩm chính hãng tại ${SHOP_NAME}: máy lạnh, điều hòa, máy lọc không khí, máy lọc nước, thiết bị nhà thông minh giá tốt nhất, bảo hành uy tín.`,
    "/san-pham",
  );
  return {
    ...meta,
    alternates: {
      canonical: canonicalUrl,
    },
  } as Metadata;
}

const STYLES = {
  main: cn("w-full bg-background min-h-screen flex flex-col"),
  footer: cn(
    "w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

async function getCachedCategories() {
  return getCategoriesAction().then(unwrapActionResult);
}

// This hub page only needs to show a *preview* per category — the category's own
// `/san-pham/{slug}` page is the authoritative, fully crawlable listing. Keeping
// this bounded (rather than growing with the catalog) is what makes it scale;
// the "Xem tất cả" link on each section is the crawl path into the rest.
const INITIAL_PER_SECTION = 24;

async function getCachedCategorySections(): Promise<CategorySectionData[]> {
  const allCategories = await getCachedCategories();

  // Build sort order: group.orderIndex * 1000 + category.orderIndex
  const catOrder = new Map<string, number>();
  allCategories.forEach((cat, i) => {
    const groupOrder =
      (cat as { group?: { orderIndex?: number } }).group?.orderIndex ?? 999;
    catOrder.set(cat.id, groupOrder * 1000 + (cat.orderIndex ?? i));
  });

  const sections = await Promise.all(
    allCategories.map(async (cat) => {
      const { data: products, totalCount, error } = await getProductsAction({
        categoryId: cat.id,
        isPublished: true,
        limit: INITIAL_PER_SECTION,
        offset: 0,
      });
      if (error) throw new Error(error);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        initialProducts: products,
        totalCount,
      };
    }),
  );

  return sections
    .filter((s) => s.totalCount > 0)
    .sort(
      (a, b) =>
        (catOrder.get(a.categoryId) ?? 999999) -
        (catOrder.get(b.categoryId) ?? 999999),
    );
}

export default async function ProductsPage() {
  const sections = await getCachedCategorySections();

  return (
    <main className={STYLES.main}>
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 w-full max-w-400 mx-auto">
        {/* Recently Viewed Products */}
        <RecentlyViewedSection />

        <div className="flex flex-col gap-1.5 pb-4 border-b border-border/40">
          <TypographyH1>Tất cả sản phẩm</TypographyH1>
        </div>

        <CategorySectionsGrid sections={sections} />

        {/* Footer rights & Back to top */}
        <div className="w-full pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <TypographySmall>
            &copy; {new Date().getFullYear()} Điện máy ELC.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </div>
      </div>

      {/* Breadcrumb schema — server-rendered so Google always sees it, see generateBreadcrumbSchema doc */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateBreadcrumbSchema(
              [{ label: "Sản phẩm" }],
              `${BASE_URL}/san-pham`,
            ),
          ),
        }}
      />
    </main>
  );
}
