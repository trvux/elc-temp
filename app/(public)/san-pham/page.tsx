import type { Metadata } from "next";
import { getCatalogPageAction, getProductsAction } from "@/modules/catalog/presentation/actions";
import { PRODUCT_STATUS } from "@/modules/catalog/domain";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getSystemPageBySlugAction } from "@/modules/system-page/presentation/actions";
import { FAQAccordion, getFAQsAction } from "@/modules/faq";
import {
  CategorySectionsGrid,
  type CategorySectionData,
} from "@/shared/components/organisms/layout/user/category-sections-grid";
import { Breadcrumbs } from "@/shared/components/organisms/layout/user/breadcrumbs";
import { ProductDescription } from "@/shared/components/organisms/layout/user/product-description";
import { PreviewContent } from "@/shared/components/organisms/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/organisms/layout/user/scroll-to-top";
import { RecentlyViewedSection } from "@/shared/components/organisms/layout/user/recently-viewed-section";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { excerptFromRichText } from "@/shared/lib/rich-text";
import { BASE_URL, SEOSchema, toJsonLdHtml } from "@/shared/lib/seo-schema";
import { cn } from "@/shared/lib/utils";

const PAGE_URL = `${BASE_URL}/san-pham`;
// Fallback copy for when admin hasn't filled in catalog-page SEO fields yet
// (was the case site-wide until now) — without this, generateMetadata
// returned {} and the hub page — arguably the single most-linked page on
// the site — fell all the way back to the root layout's generic site
// tagline instead of anything catalog-specific.
// The hub is a navigation page, NOT the owner of the generic "máy lạnh /
// điều hòa" query — that belongs to /san-pham/may-lanh (see
// docs/rfc-seo-intent-architecture.md). Keep this title neutral so hub, group
// and homepage stop competing for the same head terms.
const DEFAULT_META_TITLE = "Sản phẩm điện lạnh chính hãng | Điện Máy ELC";
const DEFAULT_META_DESCRIPTION =
  "Danh mục sản phẩm điện lạnh chính hãng tại Điện máy ELC: máy lạnh Daikin, LG, hệ thống cấp khí tươi Menred, máy lọc nước, nhà thông minh. Giao hàng nhanh, lắp đặt chuyên nghiệp, bảo hành chính hãng.";

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
      // Every other route inherits app/opengraph-image.png automatically
      // via Next.js's file-convention — but that only applies when a route
      // does NOT declare its own `openGraph` object. This page always has,
      // since title/description are dynamic (from `catalogPage`), which
      // silently dropped the image with no fallback. Confirmed in
      // production (2026-09-25): /san-pham — the single most-linked page
      // on the site per this file's own comment above — had zero og:image,
      // so sharing it on Facebook/Zalo/Messenger showed no preview image.
      images: [`${BASE_URL}/opengraph-image.png`],
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
//
// 24/section × ~12 real categories still rendered the whole hub at 3.79MB —
// confirmed live via GSC URL Inspection (2026-10-01) that this alone pushed
// the page past Google's documented 2MB per-page indexing cutoff, same
// failure mode found and fixed on the group/brand listing pages the same
// day (PREVIEW_LIMIT in ProductListModule.tsx). Unlike those pages, this
// hub's own JSON-LD was always tiny (1.8KB, just category links) — the
// weight here is almost entirely the rendered product cards themselves, so
// cutting the per-section count is the whole fix, no separate schema
// change needed. Checked with real Điện Máy Xanh's own /may-lanh listing
// (894KB total) for a sanity floor — they bound their own initial grid
// too (a client-side "Xem thêm" button), just like this page already has.
const INITIAL_PER_SECTION = 5;

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
        groupId: cat.group?.id ?? null,
        groupName: cat.group?.name ?? null,
        groupSlug: cat.group?.slug ?? null,
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
  const [sections, { data: catalogPage }, { data: systemPage }] = await Promise.all([
    getCachedCategorySections(),
    getCatalogPageAction(),
    getSystemPageBySlugAction("san-pham"),
  ]);

  // FAQ + FAQPage schema — same infra brand/group/category/hp_page pages
  // already use (modules/faq, SEOSchema.getFAQPage), attached here via the
  // "Trang sản phẩm" system_pages row rather than a brand/group/category/
  // hp_page id, since this hub has no such id of its own.
  const faqs = systemPage
    ? await getFAQsAction("system_page", systemPage.id).then(unwrapActionResult)
    : [];

  return (
    <main className={STYLES.main}>
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 w-full max-w-350 mx-auto">
        <Breadcrumbs items={[{ label: "Sản phẩm", href: "/san-pham", active: true }]} />

        {/* Recently Viewed Products */}
        <RecentlyViewedSection />

        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/40">
          <h1 className="type-headline">Tất cả sản phẩm</h1>
          <div className="flex items-center gap-2 shrink-0">
            {/* Nút "Lọc" (facet/filter) sẽ vào đây khi filter theo thuộc tính được xây */}
          </div>
        </div>

        <CategorySectionsGrid sections={sections} />

        {/* Sau lưới sản phẩm, không phải trước — người xem cần thấy sản
            phẩm trước tiên; nội dung này chỉ dành cho ai muốn tìm hiểu
            thêm, không nên chắn đường trước danh mục. */}
        {catalogPage?.content ? (
          <ProductDescription variant="hero">
            <PreviewContent content={catalogPage.content} fallbackAlt="Tất cả sản phẩm" size="sm" className="typeset-hero" />
          </ProductDescription>
        ) : null}

        {faqs.length > 0 && (
          <section className="border-t border-dashed border-border/40 pt-6">
            <FAQAccordion faqs={faqs} />
          </section>
        )}

        {/* Footer rights & Back to top */}
        <div className="w-full pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <small className="type-caption">
            &copy; {new Date().getFullYear()} Điện máy ELC.
          </small>
          <ScrollToTop className={STYLES.scrollToTop}>
            <small className="type-caption">Quay lại đầu trang</small>
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
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: toJsonLdHtml(collectionPageSchema) }}
            />
            {faqs.length > 0 && (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: toJsonLdHtml({ "@context": "https://schema.org", ...SEOSchema.getFAQPage(faqs) }),
                }}
              />
            )}
          </>
        );
      })()}
    </main>
  );
}
