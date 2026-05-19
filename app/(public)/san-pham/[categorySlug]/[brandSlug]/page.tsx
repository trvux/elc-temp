
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
import { Button } from "@/shared/components/ui/button";
import {
  TypographyH1,
  TypographyLarge,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { getQueryTokens } from "@/shared/lib/search-utils";
import { createClient } from "@/shared/lib/supabase/server";
import { cn, formatPrice } from "@/shared/lib/utils";
import {
  generateBrandMetadata,
  generateCollectionSchema,
  SHOP_NAME,
} from "@/shared/lib/seo-utils";
import { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Props = {
  params: Promise<{ categorySlug: string; brandSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { categorySlug, brandSlug } = await params;
  const supabase = await createClient();

  const [{ data: category }, { data: brand }] = await Promise.all([
    supabase.from("categories").select("*").ilike("slug", categorySlug).single(),
    supabase.from("brands").select("*").ilike("slug", brandSlug).single(),
  ]);

  if (!category || !brand) return {};

  const brandMetadata = generateBrandMetadata(brand, category);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn").replace(/\/$/, "");
  
  return {
    ...brandMetadata,
    alternates: {
      canonical: `${baseUrl}/san-pham/${categorySlug}/${brandSlug}`,
    },
  };
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
  productCard: cn("group flex flex-col h-full"),
  pagination: cn("mt-12 md:mt-16"),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

export default async function CategoryBrandPage({ params, searchParams }: Props) {
  const { categorySlug, brandSlug } = await params;
  const sParams = await searchParams;
  const supabase = await createClient();

  const [{ data: category }, { data: brand }] = await Promise.all([
    supabase.from("categories").select("*").ilike("slug", categorySlug).single(),
    supabase.from("brands").select("*").ilike("slug", brandSlug).single(),
  ]);

  if (!category || !brand) notFound();

  const q = typeof sParams.q === "string" ? sParams.q.trim() : "";
  const minPrice = typeof sParams.minPrice === "string" ? Number(sParams.minPrice) : undefined;
  const maxPrice = typeof sParams.maxPrice === "string" ? Number(sParams.maxPrice) : undefined;
  const currentPage = Number(sParams.page) || 1;
  const pageSize = 12;

  const allCategories = await getCategories({ type: "PRODUCT" });
  const currentCategory = {
    ...category,
    displayName: getCategoryDisplayName(category),
  };

  const categoryIds = await getCategoryIdsBySlug(categorySlug);
  const queryTokens = getQueryTokens(q);
  
  const { products, totalCount, availableFilters } = await searchProducts(q, {
    categoryIds,
    brandIds: [brand.id],
    isPublished: true,
    minPrice,
    maxPrice,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        <Breadcrumbs 
          items={[
            { label: currentCategory.displayName, href: `/san-pham/${categorySlug}` },
            { label: brand.name, active: true }
          ]} 
        />

        <header className={STYLES.header}>
          <TypographyH1 className={STYLES.title}>
            {currentCategory.displayName} {brand.name}
          </TypographyH1>
          <TypographyLarge className="flex items-center gap-x-1 text-sm! md:text-md! lg:text-lg! text-muted-foreground">
            Danh sách{" "}
            <span className="flex gap-x-1 bg-blue-100 text-blue-800 px-2 rounded-sm items-center">
              {totalCount} sản phẩm
            </span>{" "}
            thuộc thương hiệu
          </TypographyLarge>
        </header>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1">
              <Suspense fallback={null}>
                <ProductSearch />
              </Suspense>
            </div>
            <div className="lg:hidden">
              <ProductFilterMobile 
                categories={allCategories}
                availableFilters={availableFilters}
              />
            </div>
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
                      categorySlug={categorySlug}
                      brandSlug={brand.slug}
                      queryTokens={queryTokens}
                      priority={index < 8}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border border-dashed rounded-2xl bg-muted/20">
                  <p>Không tìm thấy sản phẩm nào khớp với bộ lọc.</p>
                  <Button variant="link" onClick={() => window.location.href = window.location.pathname}>
                    Xóa tất cả bộ lọc
                  </Button>
                </div>
              )}

              {totalPages > 1 && (
                <div className={STYLES.pagination}>
                  <ProductPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-20 flex justify-center border-t pt-8">
          <ScrollToTop />
        </div>

      </div>
      {/* Google Price Range Schema */}
      {(() => {
        const schema = generateCollectionSchema(
          {
            ...currentCategory,
            slug: `${categorySlug}/${brandSlug}`,
            name: `${currentCategory.displayName} ${brand.name}`,
          },
          products
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
