import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { ProductFilters } from "@/modules/catalog/presentation/components/ProductFilters";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import {
  CategorySectionsGrid,
  type CategorySectionData,
} from "@/shared/components/layout/user/category-sections-grid";
import { FilteredGridWrapper } from "@/shared/components/layout/user/filtered-grid-wrapper";
import { InfiniteProductGrid } from "@/shared/components/layout/user/infinite-product-grid";
import { ProductPagination } from "@/shared/components/layout/user/product-pagination";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { RecentlyViewedSection } from "@/shared/components/layout/user/recently-viewed-section";
import { buildPageHref } from "@/shared/lib/pagination";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/components/ui/sidebar";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TypographyH1,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { getCachedSystemPage } from "@/shared/lib/cached-system-page";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { getQueryTokens } from "@/shared/lib/search-utils";
import {
  BASE_URL,
  generateBreadcrumbSchema,
  generateCollectionSchema,
  generateSystemPageMetadata,
  SHOP_NAME,
} from "@/shared/lib/seo-utils";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const sParams = await searchParams;
  const q =
    typeof sParams.search === "string"
      ? sParams.search.trim()
      : typeof sParams.q === "string"
        ? sParams.q.trim()
        : "";
  const brands =
    typeof sParams.brands === "string"
      ? [sParams.brands]
      : Array.isArray(sParams.brands)
        ? sParams.brands
        : [];

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn";
  const canonicalUrl = `${baseUrl}/san-pham`;
  // Page 2+ is just "more of the same list", not a distinct search landing page —
  // same reasoning as the [location] pages: keep it crawlable (real <Link>s) but
  // out of the index, canonicalized to page 1, so it doesn't bloat the index with
  // thin near-duplicates.
  const isPastFirstPage = Math.floor(Number(sParams.page)) > 1;

  if (q) {
    const title = `Kết quả tìm kiếm cho "${q}" | ${SHOP_NAME}`;
    const description = `Tìm thấy các sản phẩm liên quan đến "${q}" tại ${SHOP_NAME}. Cam kết hàng chính hãng, giá tốt nhất, giao hàng nhanh.`;
    return {
      title,
      description,
      robots: { index: false, follow: true },
    };
  }

  if (brands.length === 1) {
    const brandName = brands[0].charAt(0).toUpperCase() + brands[0].slice(1);
    return {
      title: `Danh sách sản phẩm ${brandName} chính hãng | ${SHOP_NAME}`,
      description: `Khám phá các sản phẩm ${brandName} chính hãng tại ${SHOP_NAME}. Cam kết giá tốt nhất, bảo hành uy tín, hỗ trợ lắp đặt chuyên nghiệp.`,
      alternates: {
        canonical: canonicalUrl,
      },
      ...(isPastFirstPage ? { robots: { index: false, follow: true } } : {}),
    };
  }

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
  header: cn("flex flex-col items-center text-center gap-3 w-full"),
  title: cn("w-full max-w-none! text-wrap!"),
  skeletonGrid: cn(
    "grid gap-x-4 gap-y-6 md:gap-y-12 min-h-[450px] [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]",
  ),
  emptyState: cn("py-24 text-center min-h-[300px] w-full animate-fade-in-up"),
  emptyText: cn("text-muted-foreground/60 italic text-sm"),
  footer: cn(
    "w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  return <CachedProductsView params={params} />;
}

async function getCachedCategories() {
  "use cache";
  cacheLife("days");
  cacheTag("products-list", "categories");
  setUseStaticClient(true);
  return getCategoriesAction().then(unwrapActionResult);
}

// One real, crawlable page of products for the filtered/search view — every page is
// server-rendered at its own `?page=N` URL via ProductPagination, so this scales to
// any catalog size instead of hard-capping how much a crawler without JS can see.
const PAGE_SIZE = 30;
// This hub page only needs to show a *preview* per category — the category's own
// `/san-pham/{slug}` page (now fully paginated) is the authoritative, fully
// crawlable listing. Keeping this bounded (rather than growing with the catalog)
// is what makes it scale; the "Xem tất cả" link on each section is the crawl path
// into the rest.
const INITIAL_PER_SECTION = 24;

async function getCachedCategorySections(): Promise<CategorySectionData[]> {
  "use cache";
  cacheLife("days");
  cacheTag("products-list", "categories");
  setUseStaticClient(true);

  const allCategories = await getCategoriesAction().then(unwrapActionResult);

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
      // Loi that su (Go API down/timeout) phai throw de "use cache" giu ban
      // cache cu thay vi coi nhu category nay khong co san pham.
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

async function getCachedProductsData(
  q: string,
  minPrice: number | undefined,
  maxPrice: number | undefined,
  brandIds: string[],
  brandSlugs: string[],
  specs: Record<string, string[]>,
  offset: number,
) {
  "use cache";
  cacheLife("days");
  cacheTag("products-list");
  setUseStaticClient(true);

  const { data: products, totalCount, facets: availableFilters, error } = await getProductsAction({
    isPublished: true,
    search: q,
    minPrice,
    maxPrice,
    brandIds,
    brandSlugs,
    specs,
    limit: PAGE_SIZE,
    offset,
  });
  if (error) throw new Error(error);

  return { products, totalCount, availableFilters };
}

async function CachedProductsView({
  params,
}: {
  params: { [key: string]: string | string[] | undefined };
}) {
  "use cache";
  cacheTag("products-list", "categories");

  const q =
    typeof params.search === "string"
      ? params.search.trim()
      : typeof params.q === "string"
        ? params.q.trim()
        : "";
  const minPrice =
    typeof params.minPrice === "string" && params.minPrice
      ? Number(params.minPrice)
      : undefined;
  const maxPrice =
    typeof params.maxPrice === "string" && params.maxPrice
      ? Number(params.maxPrice)
      : undefined;

  const brandSlugs = Array.isArray(params.brands)
    ? params.brands
    : typeof params.brands === "string"
      ? [params.brands]
      : [];
  const brandIds = Array.isArray(params.brandIds)
    ? params.brandIds
    : typeof params.brandIds === "string"
      ? [params.brandIds]
      : [];

  const specs: Record<string, string[]> = {};
  Object.keys(params).forEach((key) => {
    if (key.startsWith("spec_")) {
      const label = key.replace("spec_", "");
      const val = params[key];
      specs[label] = Array.isArray(val)
        ? val
        : typeof val === "string"
          ? [val]
          : [];
    }
  });

  const hasFiltersOrSearch = !!(
    q ||
    brandSlugs.length > 0 ||
    brandIds.length > 0 ||
    minPrice ||
    maxPrice ||
    Object.keys(specs).length > 0 ||
    (typeof params.condition === "string" && params.condition)
  );

  const currentPage = Math.max(1, Math.floor(Number(params.page)) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const allCategories = await getCachedCategories();
  cacheLife("hours");
  const queryTokens = getQueryTokens(q);

  // H1 must track the SEO <title> (system_pages.metaTitle) instead of a hardcoded
  // generic string — a big gap between what users read as the page heading and what
  // the <title> tag claims is exactly what makes Google discard the <title> and
  // substitute the H1 into the search snippet instead (this page ranked with H1
  // "Tất cả sản phẩm" showing up in place of the real SEO title for that reason).
  const systemPage = q ? null : await getCachedSystemPage("san-pham");
  const seoH1 = systemPage?.metaTitle
    ?.replace(/\s*\|\s*Điện máy ELC\s*$/i, "")
    .trim();

  const { products, totalCount, availableFilters } =
    await getCachedProductsData(
      q,
      minPrice,
      maxPrice,
      brandIds,
      brandSlugs,
      specs,
      offset,
    );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const sections = hasFiltersOrSearch
    ? null
    : await getCachedCategorySections();

  const fetchParams = {
    q: q || undefined,
    minPrice,
    maxPrice,
    brands: brandSlugs.length > 0 ? brandSlugs : undefined,
    brandIds: brandIds.length > 0 ? brandIds : undefined,
    specs: Object.keys(specs).length > 0 ? specs : undefined,
  };

  return (
    <main className="w-full bg-background min-h-screen public-catalog-page">
      {/* Main sidebar + grid section */}
      <div className="w-full relative">
        <SidebarProvider
          defaultOpen={false}
          className="min-h-0 relative w-full flex items-start"
        >
          <Sidebar variant="inset" className="absolute! h-full!">
            <SidebarContent className="bg-sidebar p-5">
              <ProductFilters
                categories={allCategories}
                availableFilters={availableFilters}
              />
            </SidebarContent>
          </Sidebar>

          <SidebarInset className="min-w-0 flex-1 bg-background min-h-[calc(100vh-var(--header-height,64px)-16px)] md:m-2 md:ml-0 md:rounded-xl md:shadow-sm md:border md:border-border/40 overflow-hidden">
            {/* Sticky Header next to Sidebar Trigger */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
              <div className="h-4 w-px bg-border mx-2" />
              <div className="flex-1 min-w-0">
                <Breadcrumbs items={[{ label: "Sản phẩm", active: true }]} />
              </div>
            </header>

            {/* Page content container */}
            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 min-w-0 w-full">
              {/* Recently Viewed Products */}
              <RecentlyViewedSection />

              {/* Header Title and Count */}
              <div className="flex flex-col gap-1.5 pb-4 border-b border-border/40">
                <TypographyH1>
                  {q ? `Kết quả cho "${q}"` : seoH1 || "Tất cả sản phẩm"}
                </TypographyH1>
                <p className="text-sm text-muted-foreground">
                  Danh sách {totalCount} sản phẩm đáp ứng tiêu chí
                </p>
              </div>

              {/* Grid Wrapper */}
              <FilteredGridWrapper
                fallback={
                  <div className={STYLES.skeletonGrid}>
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="flex flex-col gap-4">
                        <Skeleton className="aspect-video w-full rounded-2xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-2/3" />
                        </div>
                        <Skeleton className="h-6 w-1/3" />
                      </div>
                    ))}
                  </div>
                }
              >
                {sections ? (
                  <CategorySectionsGrid
                    sections={sections}
                    queryTokens={queryTokens}
                  />
                ) : (
                  <InfiniteProductGrid
                    initialProducts={products}
                    totalCount={totalCount}
                    fetchParams={fetchParams}
                    queryTokens={queryTokens}
                    initialOffset={offset}
                  />
                )}
              </FilteredGridWrapper>

              {!sections && (
                <ProductPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  buildHref={(page) => buildPageHref(params, page)}
                />
              )}

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
          </SidebarInset>
        </SidebarProvider>
      </div>

      {/* Schema collections SEO */}
      {(() => {
        const schema = generateCollectionSchema(
          {
            name: "Máy lạnh, điều hòa tiết kiệm điện, giao nhanh",
            slug: "san-pham",
            description:
              "Máy lạnh, điều hòa trung tâm và hệ thống khí tươi chính hãng tại Điện máy ELC. Đầy đủ dịch vụ thi công lắp đặt, bảo trì, cho thuê và thu cũ đổi mới uy tín.",
          },
          products,
          undefined,
          totalCount,
        );
        if (!schema) return null;
        return (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(schema),
            }}
          />
        );
      })()}

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
