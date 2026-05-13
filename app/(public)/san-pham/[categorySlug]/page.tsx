import { searchProducts } from "@/modules/catalog/application";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { ProductFilterMobile } from "@/modules/catalog/presentation/components/ProductFilterMobile";
import { ProductFilters } from "@/modules/catalog/presentation/components/ProductFilters";
import {
  getCategories,
  getCategoryIdsBySlug,
} from "@/modules/category/application";
import { getCategoryDisplayName } from "@/modules/category/application/getCategoryDisplayName";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { HighlightedText } from "@/shared/components/layout/user/highlighted-text";
import { ProductPagination } from "@/shared/components/layout/user/product-pagination";
import { ProductSearch } from "@/shared/components/layout/user/product-search";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import {
  TypographyH1,
  TypographyLarge,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { getQueryTokens } from "@/shared/lib/search-utils";
import { createClient } from "@/shared/lib/supabase/server";
import { cn, formatPrice } from "@/shared/lib/utils";
import {
  generateCategoryMetadata,
  generateCollectionSchema,
  generateBrandMetadata,
  SHOP_NAME,
} from "@/shared/lib/seo-utils";
import { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Props = {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { categorySlug } = await params;
  const sParams = await searchParams;
  const supabase = await createClient();

  // 1. Try Category first
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, meta_title, meta_description, image_url")
    .ilike("slug", categorySlug)
    .single();

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn").replace(/\/$/, "");
  const previousImages = (await parent).openGraph?.images || [];

  if (category) {
    const brands = typeof sParams.brands === "string" ? [sParams.brands] : Array.isArray(sParams.brands) ? sParams.brands : [];
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", category.id);

    let seoMetadata = generateCategoryMetadata(category, count || 0);
    
    if (brands.length === 1) {
      const { data: bData } = await supabase.from("brands").select("name").ilike("slug", brands[0]).single();
      const brandName = bData?.name || brands[0];
      const title = `Danh sách ${category.name} ${brandName} chính hãng, giá tốt nhất | ${SHOP_NAME}`;
      const description = `Mua ${category.name} ${brandName} chính hãng tại Điện máy ELC. Cam kết chất lượng cao, bảo hành lâu dài, lắp đặt chuyên nghiệp, giá rẻ nhất thị trường.`;
      
      seoMetadata = {
        ...seoMetadata,
        title,
        description,
        openGraph: {
          ...seoMetadata.openGraph,
          title,
          description,
          images: seoMetadata.openGraph?.images || [],
          type: seoMetadata.openGraph?.type || "website",
        }
      };
    }

    return {
      ...seoMetadata,
      alternates: { canonical: `${baseUrl}/san-pham/${categorySlug}` },
      openGraph: {
        ...seoMetadata.openGraph,
        images: [...(seoMetadata.openGraph?.images || []), ...previousImages],
      }
    } as Metadata;
  }

  // 2. Try Brand if not category
  const { data: brand } = await supabase
    .from("brands")
    .select("id, name, description")
    .ilike("slug", categorySlug)
    .single();

  if (brand) {
    const brandMetadata = generateBrandMetadata(brand);
    return {
      ...brandMetadata,
      alternates: { canonical: `${baseUrl}/san-pham/${categorySlug}` },
    };
  }

  return {};
}

const STYLES = {
  main: cn("w-full px-4 py-12 md:px-8"),
  container: cn(
    "mx-auto w-full px-4 md:px-6 max-w-7xl flex flex-col gap-6 md:gap-12",
  ),
  header: cn("flex flex-col items-center text-center gap-3"),
  title: cn("w-full max-w-none! text-wrap!"),
  grid: cn(
    "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16",
  ),
  productCard: cn("group flex flex-col"),
  highlight: cn("bg-primary/15 text-primary not-italic px-0.5"),
  emptyState: cn("py-24 text-center"),
  emptyText: cn("text-muted-foreground/60 italic text-sm"),
  paginationWrapper: cn("mt-4"),
  footer: cn(
    "border-t pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

export default async function CategoryPage({ params, searchParams }: Props) {
  const { categorySlug } = await params;
  const sParams = await searchParams;

  const q = typeof sParams.q === "string" ? sParams.q.trim() : "";
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
  
  let brandIds = Array.isArray(sParams.brandIds)
    ? sParams.brandIds
    : typeof sParams.brandIds === "string"
      ? [sParams.brandIds]
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

  const allCategories = await getCategories({ type: "PRODUCT" });
  const currentCategoryRaw = allCategories.find((c) => c.slug.toLowerCase() === categorySlug.toLowerCase());
  let brandInfo = null;

  if (!currentCategoryRaw) {
    // Check if it's a brand
    const supabase = await createClient();
    const { data: brand } = await supabase
      .from("brands")
      .select("*")
      .ilike("slug", categorySlug)
      .single();
    
    if (!brand) notFound();
    brandInfo = brand;
    if (!brandIds.includes(brand.id)) {
      brandIds = [...brandIds, brand.id];
    }
  }

  const currentCategory = currentCategoryRaw ? {
    ...currentCategoryRaw,
    displayName: getCategoryDisplayName(currentCategoryRaw),
  } : null;

  const categoryIds = currentCategoryRaw ? await getCategoryIdsBySlug(categorySlug) : undefined;
  const queryTokens = getQueryTokens(q);

  const { products, totalCount, availableFilters } = await searchProducts(q, {
    categoryIds,
    isPublished: true,
    minPrice,
    maxPrice,
    brandIds,
    brandSlugs,
    specs,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  const pageTitle = currentCategory ? currentCategory.displayName : brandInfo?.name;
  const subTitlePrefix = currentCategory ? "danh mục" : "thương hiệu";

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        <Breadcrumbs 
          items={[
            // Show parent category if it exists (e.g., Trang chủ / Máy lạnh / Treo tường)
            ...(currentCategoryRaw?.parentId ? (() => {
              const parent = allCategories.find(c => c.id === currentCategoryRaw.parentId);
              return parent ? [{ label: parent.name, href: `/san-pham/${parent.slug}` }] : [];
            })() : []),
            { label: pageTitle || "", active: true }
          ]} 
        />

        <header className={STYLES.header}>
          <TypographyH1 className={STYLES.title}>
            {pageTitle}
          </TypographyH1>
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
            <ProductFilterMobile
              categories={allCategories}
              availableFilters={availableFilters}
            />
          </div>
          <div className="flex flex-col lg:flex-row gap-12">
            <aside className="hidden lg:block w-64 shrink-0">
              <ProductFilters
                categories={allCategories}
                availableFilters={availableFilters}
              />
            </aside>

            <div className="flex-1">
              {products.length > 0 ? (
                <div className={STYLES.grid}>
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categorySlug={product.category?.slug || categorySlug}
                      brandSlug={product.brand?.slug || "all"}
                      queryTokens={queryTokens}
                      priority={index < 8}
                    />
                  ))}
                </div>
              ) : (
                <div className={STYLES.emptyState}>
                  <p className={STYLES.emptyText}>
                    Hiện chưa có sản phẩm nào trong danh mục này.
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
            &copy; {new Date().getFullYear()} ELC Holdings. Đã đăng ký bản
            quyền.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
      {/* Google Price Range Schema */}
      {(() => {
        const schema = generateCollectionSchema(currentCategory || brandInfo, products);
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
