import { searchProducts } from "@/modules/catalog/application";
import { ResolvedEntity } from "@/modules/catalog/application/resolveProductPath";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { ProductFilterMobile } from "@/modules/catalog/presentation/components/ProductFilterMobile";
import { ProductFilters } from "@/modules/catalog/presentation/components/ProductFilters";
import { getProductCategories } from "@/modules/category-new/application";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { ProductPagination } from "@/shared/components/layout/user/product-pagination";
import { ProductSearch } from "@/shared/components/layout/user/product-search";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
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
  main: cn("w-full px-4 py-12 md:px-8"),
  container: cn(
    "mx-auto w-full px-4 md:px-6 max-w-7xl flex flex-col gap-6 md:gap-12",
  ),
  header: cn("flex flex-col items-center text-center gap-3"),
  title: cn("w-full max-w-none! text-wrap!"),
  grid: cn(
    "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6 md:gap-y-16 min-h-[450px] content-start animate-fade-in-up",
  ),
  emptyState: cn("py-24 text-center min-h-[300px] animate-fade-in-up"),
  emptyText: cn("text-muted-foreground/60 italic text-sm"),
  paginationWrapper: cn("mt-4"),
  footer: cn(
    "border-t pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground",
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

  const allCategories = await getProductCategories();

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
      <div className={STYLES.container}>
        <Breadcrumbs
          items={[
            ...(breadcrumbParent ? [breadcrumbParent] : []),
            { label: pageTitle, active: true },
          ]}
        />

        <header className={STYLES.header}>
          <TypographyH1 className={STYLES.title}>{pageTitle}</TypographyH1>
          <TypographyLarge className="flex items-center gap-x-1 text-sm! md:text-md! lg:text-lg! text-muted-foreground">
            Danh sách{" "}
            <span className="flex gap-x-1 bg-blue-100 text-blue-800 px-2 rounded-sm items-center">
              {totalCount} sản phẩm
            </span>{" "}
            thuộc {subTitlePrefix}
          </TypographyLarge>
        </header>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1">
              <Suspense fallback={null}>
                <ProductSearch />
              </Suspense>
            </div>
            <Suspense fallback={null}>
              <ProductFilterMobile
                categories={allCategories}
                availableFilters={availableFilters}
              />
            </Suspense>
          </div>
          <div className="flex flex-col lg:flex-row gap-12">
            <aside className="hidden lg:block w-64 shrink-0">
              <Suspense fallback={
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-muted rounded w-1/2" />
                  <div className="h-40 bg-muted rounded" />
                </div>
              }>
                <ProductFilters
                  categories={allCategories}
                  availableFilters={availableFilters}
                />
              </Suspense>
            </aside>

            <div className="flex-1">
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
                  <ProductPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    searchParams={sParams}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {currentYear} ELC Holdings. Đã đăng ký bản
            quyền.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
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
