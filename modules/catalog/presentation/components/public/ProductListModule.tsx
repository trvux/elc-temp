import { searchProducts } from "@/modules/catalog/application";
import { ResolvedEntity } from "@/modules/catalog/application/resolveProductPath";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { ProductFilterMobile } from "@/modules/catalog/presentation/components/ProductFilterMobile";
import { ProductFilters } from "@/modules/catalog/presentation/components/ProductFilters";
import { getCategories } from "@/modules/category/application";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { PaginationNav } from "@/shared/components/layout/user/pagination-nav";
import { ProductSearch } from "@/shared/components/layout/user/product-search";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import {
  TypographyH1,
  TypographyLarge,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { getQueryTokens } from "@/shared/lib/search-utils";
import { generateCollectionSchema } from "@/shared/lib/seo-utils";
import { createClient, setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";

interface ProductListModuleProps {
  entity: ResolvedEntity;
  searchParams: { [key: string]: string | string[] | undefined };
}

const STYLES = {
  main: cn("w-full bg-background min-h-screen flex flex-col"),
  header: cn("flex flex-col items-center text-center gap-3 w-full"),
  title: cn("w-full max-w-none! text-wrap!"),
  grid: cn(
    "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6 md:gap-y-16 min-h-[450px] content-start animate-fade-in-up",
  ),
  emptyState: cn("py-24 text-center min-h-[300px] w-full animate-fade-in-up"),
  emptyText: cn("text-muted-foreground/60 italic text-sm"),
  paginationWrapper: cn("mt-12"),
  footer: cn(
    "w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

async function getCachedListModuleData(
  entity: ResolvedEntity,
  q: string,
  minPrice: number | undefined,
  maxPrice: number | undefined,
  brandSlugs: string[],
  specs: Record<string, string[]>,
  currentPage: number,
  pageSize: number
) {
  "use cache";
  cacheLife({ stale: 0, revalidate: 60, expire: 3600 });
  cacheTag("products");
  setUseStaticClient(true);

  if (!entity) {
    throw new Error("Entity is required");
  }

  let categoryIds: string[] | undefined;
  let brandIds: string[] | undefined;
  let breadcrumbParent: { label: string; href: string } | null = null;

  const supabase = await createClient();

  if (entity.type === "brand") {
    brandIds = [entity.data.id];
  } else if (entity.type === "category") {
    categoryIds = [entity.data.id];
    if (entity.data.groupId) {
      const { data: parentGroup } = await supabase
        .from("group_categories")
        .select("name, slug")
        .eq("id", entity.data.groupId)
        .is("deleted_at", null)
        .single();
      if (parentGroup) {
        breadcrumbParent = {
          label: parentGroup.name,
          href: `/san-pham/${parentGroup.slug}`,
        };
      }
    }
  } else if (entity.type === "group") {
    const { data: groupCategories } = await supabase
      .from("categories")
      .select("id, name")
      .eq("group_id", entity.data.id)
      .is("deleted_at", null);
    categoryIds = (groupCategories || [])
      .filter((c) => !c.name.toLowerCase().includes("chưa phân loại"))
      .map((c) => c.id);
  }

  const allCategories = await getCategories();

  const { products, totalCount, availableFilters } = await searchProducts(q, {
    categoryIds,
    brandIds,
    brandSlugs,
    isPublished: true,
    minPrice,
    maxPrice,
    specs,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  return {
    products,
    totalCount,
    availableFilters,
    allCategories,
    breadcrumbParent,
    currentYear: new Date().getFullYear(),
  };
}

export async function ProductListModule({
  entity,
  searchParams,
}: ProductListModuleProps) {
  if (!entity || entity.type === "product") return notFound();

  const sParams = searchParams;
  const q =
    typeof sParams.search === "string"
      ? sParams.search.trim()
      : typeof sParams.q === "string"
        ? sParams.q.trim()
        : "";
  const minPrice =
    typeof sParams.minPrice === "string" && sParams.minPrice
      ? Number(sParams.minPrice)
      : undefined;
  const maxPrice =
    typeof sParams.maxPrice === "string" && sParams.maxPrice
      ? Number(sParams.maxPrice)
      : undefined;
  const currentPage = Number(sParams.page) || 1;
  const pageSize = 12;
  const brandSlugs = Array.isArray(sParams.brands)
    ? sParams.brands
    : typeof sParams.brands === "string"
      ? [sParams.brands]
      : [];
  const specs: Record<string, string[]> = {};
  Object.keys(sParams).forEach((key) => {
    if (key.startsWith("spec_")) {
      const label = key.replace("spec_", "");
      const val = sParams[key];
      specs[label] = Array.isArray(val)
        ? val
        : typeof val === "string"
          ? [val]
          : [];
    }
  });

  let pageTitle = "";
  let subTitlePrefix = "";

  if (entity.type === "brand") {
    pageTitle = entity.data.name;
    subTitlePrefix = "thương hiệu";
  } else if (entity.type === "category") {
    pageTitle = entity.data.name;
    subTitlePrefix = "danh mục";
  } else if (entity.type === "group") {
    pageTitle = entity.data.name;
    subTitlePrefix = "nhóm danh mục";
  }

  const {
    products,
    totalCount,
    availableFilters,
    allCategories,
    breadcrumbParent,
    currentYear,
  } = await getCachedListModuleData(
    entity,
    q,
    minPrice,
    maxPrice,
    brandSlugs,
    specs,
    currentPage,
    pageSize
  );

  const queryTokens = getQueryTokens(q);
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <main className={STYLES.main}>
      {/* ===== KHỐI 1: TIÊU ĐỀ TRANG ===== */}
      <GridSection
        id="products-header"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col gap-6 w-full">
          <header className={STYLES.header}>
            <TypographyH1 className={STYLES.title}>{pageTitle}</TypographyH1>
            <TypographyLarge className="flex items-center gap-x-1 text-sm! md:text-md! lg:text-lg! text-muted-foreground">
              Danh sách{" "}
              <span className="flex gap-x-1 bg-primary text-primary-foreground px-2 rounded-sm items-center font-medium">
                {totalCount} sản phẩm
              </span>{" "}
              thuộc {subTitlePrefix}
            </TypographyLarge>
          </header>
        </div>
      </GridSection>

      {/* ===== KHỐI 2: THANH TÌM KIẾM + BỘ LỌC MOBILE ===== */}
      <GridSection
        id="products-search"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col gap-8 w-full">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1">
              <Suspense fallback={null}>
                <ProductSearch />
              </Suspense>
            </div>
            <ProductFilterMobile
              categories={allCategories}
              availableFilters={availableFilters}
            />
          </div>
        </div>
      </GridSection>

      {/* ===== KHỐI 3: BỘ LỌC + LƯỚI SẢN PHẨM ===== */}
      <GridSection
        id="products-content"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col lg:flex-row gap-12 w-full items-start">
          <aside className="hidden lg:block w-64 shrink-0 sticky top-28 self-start">
            <ProductFilters
              categories={allCategories}
              availableFilters={availableFilters}
            />
          </aside>

          <div className="flex-1 w-full">
            {products.length > 0 ? (
              <div className={STYLES.grid}>
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    queryTokens={queryTokens}
                    priority={index < 8}
                  />
                ))}
              </div>
            ) : (
              <div className={STYLES.emptyState}>
                <p className={STYLES.emptyText}>
                  Hiện chưa có sản phẩm nào trong {subTitlePrefix} này.
                </p>
              </div>
            )}

            {totalPages > 1 && (
              <div className={STYLES.paginationWrapper}>
                <PaginationNav
                  currentPage={currentPage}
                  totalPages={totalPages}
                  searchParams={sParams}
                />
              </div>
            )}
          </div>
        </div>
      </GridSection>

      {/* ===== KHỐI 4: FOOTER BẢN QUYỀN ===== */}
      <GridSection
        id="products-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {currentYear} ELC Holdings. Đã đăng ký bản quyền.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </GridSection>

      {/* ===== KHỐI 5: BREADCRUMBS ===== */}
      <GridSection
        id="products-breadcrumbs"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <div className="w-full">
          <Breadcrumbs
            items={[
              ...(breadcrumbParent ? [breadcrumbParent] : []),
              { label: pageTitle, active: true },
            ]}
          />
        </div>
      </GridSection>

      {/* Dữ liệu cấu trúc Schema SEO */}
      {(() => {
        const schema = generateCollectionSchema(entity.data, products);
        if (!schema) return null;
        return (
          <div style={{ display: "none" }}>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
          </div>
        );
      })()}
    </main>
  );
}
