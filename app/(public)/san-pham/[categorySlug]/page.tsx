import { searchProducts } from "@/modules/catalog/application";
import { ProductFilterMobile } from "@/modules/catalog/presentation/components/ProductFilterMobile";
import { ProductFilters } from "@/modules/catalog/presentation/components/ProductFilters";
import {
  getCategories,
  getCategoryIdsBySlug,
} from "@/modules/category/application";
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
import { cn, formatPrice } from "@/shared/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@/shared/lib/supabase/server";
import { notFound } from "next/navigation";
import { getQueryTokens } from "@/shared/lib/search-utils";
import { HighlightedText } from "@/shared/components/layout/user/highlighted-text";
import { getCategoryDisplayName } from "@/modules/category/application/getCategoryDisplayName";

type Props = {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { categorySlug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("name, meta_title, meta_description, image_url")
    .eq("slug", categorySlug)
    .single();

  if (!category) return {};

  const previousImages = (await parent).openGraph?.images || [];
  const title = category.meta_title || `${category.name} | Điện máy ELC`;
  const description = category.meta_description || `Danh sách sản phẩm ${category.name} chính hãng tại Điện máy ELC.`;
  const images = category.image_url ? [category.image_url, ...previousImages] : previousImages;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
    },
  };
}

const STYLES = {
  main: cn("w-full px-4 py-12 md:px-8"),
  container: cn("mx-auto w-full px-4 md:px-6 max-w-7xl flex flex-col gap-6 md:gap-12"),
  header: cn("flex flex-col items-center text-center gap-3"),
  title: cn("w-full max-w-none! text-wrap!"),
  grid: cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16"),
  productCard: cn("group flex flex-col"),
  imageWrapper: cn("w-full overflow-hidden bg-background rounded-lg"),
  image: cn("object-contain p-4 transition-transform duration-700 group-hover:scale-105"),
  noImage: cn("w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs tracking-widest"),
  infoWrapper: cn("p-4 flex flex-col gap-3"),
  priceWrapper: cn("flex flex-col gap-1"),
  salePrice: cn("text-base md:text-lg font-bold tracking-tight"),
  originalPrice: cn("text-md text-muted-foreground line-through"),
  discountBadge: cn("rounded-sm"),
  highlight: cn("bg-primary/15 text-primary not-italic px-0.5"),
  emptyState: cn("py-24 text-center"),
  emptyText: cn("text-muted-foreground/60 italic text-sm"),
  paginationWrapper: cn("mt-4"),
  footer: cn("border-t pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground"),
  scrollToTop: cn("flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors"),
};

export default async function CategoryPage({ params, searchParams }: Props) {
  const { categorySlug } = await params;
  const sParams = await searchParams;

  const q = typeof sParams.q === "string" ? sParams.q.trim() : "";
  const minPrice = typeof sParams.minPrice === "string" && sParams.minPrice ? Number(sParams.minPrice) : undefined;
  const maxPrice = typeof sParams.maxPrice === "string" && sParams.maxPrice ? Number(sParams.maxPrice) : undefined;
  const currentPage = Number(sParams.page) || 1;
  const pageSize = 12;

  const brandSlugs = Array.isArray(sParams.brands) ? sParams.brands : typeof sParams.brands === "string" ? [sParams.brands] : [];
  const brandIds = Array.isArray(sParams.brandIds) ? sParams.brandIds : typeof sParams.brandIds === "string" ? [sParams.brandIds] : [];

  const specs: Record<string, string[]> = {};
  Object.keys(sParams).forEach((key) => {
    if (key.startsWith("spec_")) {
      const label = key.replace("spec_", "");
      const val = sParams[key];
      specs[label] = Array.isArray(val) ? val : typeof val === "string" ? [val] : [];
    }
  });

  const allCategories = await getCategories({ type: "PRODUCT" });
  const currentCategoryRaw = allCategories.find((c) => c.slug === categorySlug);
  if (!currentCategoryRaw) notFound();

  const currentCategory = { 
    ...currentCategoryRaw, 
    displayName: getCategoryDisplayName(currentCategoryRaw) 
  };

  const categoryIds = await getCategoryIdsBySlug(categorySlug);
  const queryTokens = getQueryTokens(q);

  const { products, totalCount, availableFilters } = await searchProducts(q, {
    categoryIds: categoryIds,
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

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        <header className={STYLES.header}>
          <TypographyH1 className={STYLES.title}>
            {currentCategory.displayName}
          </TypographyH1>
          <TypographyLarge className="flex items-center gap-x-1 text-sm! md:text-md! lg:text-lg! text-muted-foreground">
            Danh sách <span className="flex gap-x-1 bg-blue-100 text-blue-800 px-2 rounded-sm items-center">{totalCount} sản phẩm</span> thuộc danh mục
          </TypographyLarge>
        </header>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1">
              <Suspense fallback={null}>
                <ProductSearch />
              </Suspense>
            </div>
            <ProductFilterMobile categories={allCategories} availableFilters={availableFilters} />
          </div>
          <div className="flex flex-col lg:flex-row gap-12">
            <aside className="hidden lg:block w-64 shrink-0">
              <ProductFilters categories={allCategories} availableFilters={availableFilters} />
            </aside>

            <div className="flex-1">
              {products.length > 0 ? (
                <div className={STYLES.grid}>
                  {products.map((product, index) => (
                    <Card key={product.id} className={cn(STYLES.productCard, "border-none shadow-none hover:shadow-lg transition-all duration-300 bg-background overflow-hidden")}>
                      <Link href={`/san-pham/${currentCategory.slug}/${product.slug}`} className="flex flex-col h-full">
                        <div className={STYLES.imageWrapper}>
                          <AspectRatio ratio={16 / 9}>
                            {product.images?.[0] ? (
                              <Image src={product.images[0]} alt={product.name} fill className={STYLES.image} sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" priority={index < 4} />
                            ) : (
                              <div className={STYLES.noImage}>Chưa có ảnh</div>
                            )}
                          </AspectRatio>
                        </div>
                        <div className={STYLES.infoWrapper}>
                          <div className="flex flex-col gap-1">
                            <div className="font-semibold text-sm md:text-base line-clamp-2 min-h-[2.5rem] md:min-h-[3rem]">
                              <HighlightedText text={product.name} queryTokens={queryTokens} />
                            </div>
                            {product.sku && (
                              <TypographySmall className="text-muted-foreground uppercase">
                                SKU: <HighlightedText text={product.sku.split("/")[0].split("+")[0].trim()} queryTokens={queryTokens} />
                              </TypographySmall>
                            )}
                          </div>
                          <div className={STYLES.priceWrapper}>
                            <span className={STYLES.salePrice}>
                              {formatPrice(product.salePrice || product.originalPrice || 0)}
                            </span>
                            {product.discountPercent > 0 && (
                              <div className="flex flex-col gap-1">
                                <span className={STYLES.originalPrice}>
                                  {formatPrice(product.originalPrice || 0)}
                                </span>
                                <div>
                                  <Badge variant="destructive" className={STYLES.discountBadge}>
                                    Giảm giá: {product.discountPercent}%
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className={STYLES.emptyState}>
                  <p className={STYLES.emptyText}>Hiện chưa có sản phẩm nào trong danh mục này.</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className={STYLES.paginationWrapper}>
                  <ProductPagination currentPage={currentPage} totalPages={totalPages} searchParams={sParams} />
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className={STYLES.footer}>
          <TypographySmall>&copy; {new Date().getFullYear()} ELC Holdings. Đã đăng ký bản quyền.</TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
