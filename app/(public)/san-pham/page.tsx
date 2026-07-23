import type { Metadata } from "next";
import { getCatalogPageAction, getProductsAction } from "@/modules/catalog/presentation/actions";
import { PRODUCT_STATUS } from "@/modules/catalog/domain";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getPersonalizedShippingZoneAction } from "@/modules/shipping-zone";
import {
  CategorySectionsGrid,
  type CategorySectionData,
} from "@/shared/components/layout/user/category-sections-grid";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { CompareLinkButton } from "@/shared/components/layout/user/compare-link-button";
import { ProductDescription } from "@/shared/components/layout/user/product-description";
import { WishlistDialogButton } from "@/shared/components/layout/user/wishlist-dialog-button";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { RecentlyViewedSection } from "@/shared/components/layout/user/recently-viewed-section";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { excerptFromRichText } from "@/shared/lib/rich-text";
import { BASE_URL, toJsonLdHtml } from "@/shared/lib/seo-schema";
import { cn } from "@/shared/lib/utils";
import {
  TypographyH1,
  TypographySmall,
} from "@/shared/components/ui/typography";

const PAGE_URL = `${BASE_URL}/san-pham`;
// Fallback copy for when admin hasn't filled in catalog-page SEO fields yet
// (was the case site-wide until now) — without this, generateMetadata
// returned {} and the hub page — arguably the single most-linked page on
// the site — fell all the way back to the root layout's generic site
// tagline instead of anything catalog-specific.
// Keyword-first: "Tất cả sản phẩm" is a UI label, not something anyone
// searches for — lead with the actual product terms instead, same lesson
// learned from hp-page/brand-page titles.
const DEFAULT_META_TITLE = "Máy lạnh, hệ thống khí tươi, máy lọc nước chính hãng";
const DEFAULT_META_DESCRIPTION =
  "Máy lạnh, hệ thống cấp khí tươi, máy lọc nước chính hãng tại Điện máy ELC - đầy đủ thương hiệu Daikin, LG, Panasonic, Menred... Giao hàng nhanh, lắp đặt chuyên nghiệp, bảo hành chính hãng.";

export async function generateMetadata(): Promise<Metadata> {
  const { data: catalogPage } = await getCatalogPageAction();
  const title = catalogPage?.metaTitle || DEFAULT_META_TITLE;
  const description =
    catalogPage?.metaDescription ||
    excerptFromRichText(catalogPage?.content) ||
    DEFAULT_META_DESCRIPTION;

  return {
    title,
    description,
    alternates: { canonical: PAGE_URL },
    openGraph: {
      type: "website",
      title,
      description,
      url: PAGE_URL,
    },
  };
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
        status: PRODUCT_STATUS.PUBLISHED,
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
  const [sections, { data: catalogPage }, { data: shippingZone }] = await Promise.all([
    getCachedCategorySections(),
    getCatalogPageAction(),
    getPersonalizedShippingZoneAction(),
  ]);

  return (
    <main className={STYLES.main}>
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 w-full max-w-400 mx-auto">
        <Breadcrumbs items={[{ label: "Sản phẩm", href: "/san-pham", active: true }]} />

        {/* Recently Viewed Products */}
        <RecentlyViewedSection />

        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/40">
          <TypographyH1>Tất cả sản phẩm</TypographyH1>
          <div className="flex items-center gap-2 shrink-0">
            <WishlistDialogButton />
            <CompareLinkButton />
            {/* Nút "Lọc" (facet/filter) sẽ vào đây khi filter theo thuộc tính được xây */}
          </div>
        </div>

        <CategorySectionsGrid sections={sections} shippingZone={shippingZone} />

        {/* Sau lưới sản phẩm, không phải trước — người xem cần thấy sản
            phẩm trước tiên; nội dung này chỉ dành cho ai muốn tìm hiểu
            thêm, không nên chắn đường trước danh mục. */}
        {catalogPage?.content ? (
          <ProductDescription content={catalogPage.content} fallbackAlt="Tất cả sản phẩm" variant="hero" />
        ) : null}

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

      {/* BreadcrumbList JSON-LD is emitted by <Breadcrumbs> above. This hub
          only previews each category (INITIAL_PER_SECTION items) rather
          than listing every product, so the ItemList here links to each
          category's own full listing page instead of individual products —
          same "collection of collections" shape as a sitemap. */}
      {(() => {
        const collectionPageSchema = {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Tất cả sản phẩm",
          url: PAGE_URL,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: sections.length,
            itemListElement: sections.map((s, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              url: `${BASE_URL}/san-pham/${s.categorySlug}`,
              name: s.categoryName,
            })),
          },
        };

        return (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: toJsonLdHtml(collectionPageSchema) }}
          />
        );
      })()}
    </main>
  );
}
