import { searchProducts } from "@/modules/catalog/application";
import { productRepo } from "@/modules/catalog/infrastructure/SupabaseProductRepository";
import { ProductFilters } from "@/modules/catalog/presentation/components/ProductFilters";
import { getCategories } from "@/modules/category/application";
import { categoryRepo } from "@/modules/category/infrastructure/categoryRepo";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import {
  CategorySectionsGrid,
  type CategorySectionData,
} from "@/shared/components/layout/user/category-sections-grid";
import { FilteredGridWrapper } from "@/shared/components/layout/user/filtered-grid-wrapper";
import { InfiniteProductGrid } from "@/shared/components/layout/user/infinite-product-grid";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { RecentlyViewedSection } from "@/shared/components/layout/user/recently-viewed-section";
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
import { getQueryTokens } from "@/shared/lib/search-utils";
import {
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
    };
  }

  const systemPage = await getCachedSystemPage("san-pham");
  const meta = generateSystemPageMetadata(
    systemPage,
    `Danh sách sản phẩm Điện máy chính hãng | ${SHOP_NAME}`,
    `Khám phá hàng ngàn sản phẩm điện máy chính hãng tại ${SHOP_NAME}. Máy lạnh, điều hòa, tủ lạnh, máy giặt giá tốt nhất, bảo hành uy tín.`,
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
  return getCategories(categoryRepo);
}

const PAGE_SIZE = 30;
const INITIAL_PER_SECTION = 0; // products loaded client-side for clean full rows

async function getCachedCategorySections(): Promise<CategorySectionData[]> {
  "use cache";
  cacheLife("days");
  cacheTag("products-list", "categories");
  setUseStaticClient(true);

  const allCategories = await getCategories(categoryRepo);

  // Build sort order: group.orderIndex * 1000 + category.orderIndex
  const catOrder = new Map<string, number>();
  allCategories.forEach((cat, i) => {
    const groupOrder =
      (cat as { group?: { orderIndex?: number } }).group?.orderIndex ?? 999;
    catOrder.set(cat.id, groupOrder * 1000 + (cat.orderIndex ?? i));
  });

  // Use COUNT queries (HEAD-only, no data transfer) instead of fetching all products
  const sections = await Promise.all(
    allCategories.map(async (cat) => ({
      categoryId: cat.id,
      initialProducts: [] as CategorySectionData["initialProducts"],
      totalCount: await productRepo.count({ categoryId: cat.id, isPublished: true }),
    })),
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
) {
  "use cache";
  cacheLife("days");
  cacheTag("products-list");
  setUseStaticClient(true);

  return searchProducts(productRepo, q, {
    isPublished: true,
    minPrice,
    maxPrice,
    brandIds,
    brandSlugs,
    specs,
    limit: PAGE_SIZE,
    offset: 0,
  });
}

async function CachedProductsView({
  params,
}: {
  params: { [key: string]: string | string[] | undefined };
}) {
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

  const allCategories = await getCachedCategories();
  const queryTokens = getQueryTokens(q);

  const { products, totalCount, availableFilters } =
    await getCachedProductsData(
      q,
      minPrice,
      maxPrice,
      brandIds,
      brandSlugs,
      specs,
    );

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
                  {q ? `Kết quả cho "${q}"` : "Tất cả sản phẩm"}
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
                  />
                )}
              </FilteredGridWrapper>

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
            name: "Sản phẩm Điện máy ELC | Máy lạnh & Hệ thống khí tươi chính hãng",
            slug: "san-pham",
            description:
              "Máy lạnh, điều hòa trung tâm và hệ thống khí tươi chính hãng tại Điện máy ELC. Đầy đủ dịch vụ thi công lắp đặt, bảo trì, cho thuê và thu cũ đổi mới uy tín.",
          },
          products,
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
    </main>
  );
}
