import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import {
  TypographyH1,
  TypographyH2,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { ProductPagination } from "@/shared/components/layout/user/product-pagination";
import { ProductSearch } from "@/shared/components/layout/user/product-search";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { cn, formatPrice } from "@/shared/lib/utils";
import { getCategories, getCategoryIdsBySlug } from "@/modules/category/application";
import { getProducts, searchProducts } from "@/modules/catalog/application";
import { Percent } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const STYLES = {
  main: cn("w-full px-4 py-12 md:px-8"),
  container: cn("mx-auto w-full px-4 md:px-6 max-w-7xl flex flex-col gap-20"),
  header: cn("flex flex-col items-center text-center gap-3"),
  title: cn("w-full max-w-none! text-wrap!"),
  badge: cn("text-md text-muted-foreground"),
  searchWrapper: cn(""),
  grid: cn(
    "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16",
  ),
  productCard: cn("group flex flex-col"),
  imageWrapper: cn("w-full overflow-hidden bg-background rounded-lg"),
  image: cn(
    "object-contain p-4 transition-transform duration-700 group-hover:scale-105",
  ),
  noImage: cn(
    "w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs tracking-widest",
  ),
  infoWrapper: cn("mt-4 flex flex-col gap-1.5"),
  productName: cn(
    "text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:underline underline-offset-4",
  ),
  sku: cn("text-xs text-muted-foreground tracking-wider"),
  priceWrapper: cn("mt-1 flex flex-col gap-0.5"),
  salePrice: cn("text-base md:text-lg font-bold tracking-tight"),
  originalPriceWrapper: cn("flex items-center gap-2"),
  originalPrice: cn("text-md text-muted-foreground line-through"),
  discountBadge: cn("font-bold rounded-lg"),
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

// --- Helper functions for highlighting (mirroring the search logic) ---
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

function tokenize(str: string): string[] {
  return normalize(str)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}

function cleanTelex(word: string): string {
  if (!/[aeiou]/.test(word)) return word;
  return word.replace(/[fjx]$/, "").replace(/([aeiou])w/g, "$1");
}

function splitDigitLetter(token: string): string[] {
  return token.split(/(?<=\d)(?=[a-z])|(?<=[a-z])(?=\d)/);
}

function HighlightedText({
  text,
  queryTokens,
}: {
  text: string;
  queryTokens: string[];
}) {
  if (!queryTokens.length) return <>{text}</>;

  const parts = text.split(/(\s+)/);
  return (
    <>
      {parts.map((part, i) => {
        if (!part.trim()) return <span key={i}>{part}</span>;
        const wordTokens = tokenize(part);
        const isMatch = wordTokens.some((wt) =>
          queryTokens.some(
            (qt) => wt === qt || wt.startsWith(qt) || qt.startsWith(wt),
          ),
        );
        return isMatch ? (
          <mark key={i} className={STYLES.highlight}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

export default async function ProductsHub({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const categorySlug =
    typeof params.category === "string" ? params.category : "";
  
  const minPrice =
    typeof params.minPrice === "string" && params.minPrice
      ? Number(params.minPrice)
      : undefined;
  const maxPrice =
    typeof params.maxPrice === "string" && params.maxPrice
      ? Number(params.maxPrice)
      : undefined;
  
  const currentPage = Number(params.page) || 1;
  const pageSize = 12;

  // Fetch categories for filter UI
  const allCategories = await getCategories({ type: "PRODUCT" });

  // Resolve categorySlug -> affected IDs
  const categoryIds = categorySlug ? await getCategoryIdsBySlug(categorySlug) : [];

  // Compute query tokens for highlighting
  const queryTokens = q
    ? normalize(q)
        .split(/\s+/)
        .map(cleanTelex)
        .flatMap(splitDigitLetter)
        .filter((t) => t.length >= 2)
    : [];

  // Fetch products using the application layer (searchProducts handles fuzzy search)
  const { products, totalCount } = await searchProducts(q, {
    categoryIds: categoryIds,
    isPublished: true,
    minPrice,
    maxPrice,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });
  
  // NOTE: If categoryIds.length > 1, searchProducts needs to be updated to support 'in' filter.
  // Actually, I'll update searchProducts to handle categoryIds as an array.

  const totalPages = Math.ceil(totalCount / pageSize);
  const isSearchActive =
    !!q || !!categorySlug || minPrice !== undefined || maxPrice !== undefined;

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        {/* Header */}
        <header className={STYLES.header}>
          <TypographyH1 className={STYLES.title}>
            {q
              ? `Kết quả cho "${q}"`
              : categorySlug
                ? allCategories.find((c) => c.slug === categorySlug)?.name ||
                  "Sản phẩm"
                : "Giải pháp thông minh"}
          </TypographyH1>
          <p className={STYLES.badge}>
            {isSearchActive
              ? `${totalCount} kết quả tìm kiếm`
              : `${totalCount} sản phẩm`}
          </p>
        </header>

        {/* Search + Filter */}
        <div className={STYLES.searchWrapper}>
          <Suspense fallback={null}>
            <ProductSearch categories={allCategories} />
          </Suspense>
        </div>

        {/* Grid */}
        {products.length > 0 ? (
          <div className={STYLES.grid}>
            {products.map((product, index) => (
              <Card 
                key={product.id}
                className={cn(STYLES.productCard, "border-none shadow-none hover:shadow-lg transition-all duration-300 bg-background overflow-hidden")}
              >
                <Link
                  href={`/san-pham/${product.category?.slug ? product.category.slug : "detail"}/${product.slug}`}
                  className="flex flex-col h-full"
                >
                  {/* Ảnh */}
                  <div className={STYLES.imageWrapper}>
                    <AspectRatio ratio={16 / 9}>
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className={STYLES.image}
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          priority={index === 0}
                          loading="eager"
                        />
                      ) : (
                        <div className={STYLES.noImage}>Chưa có ảnh</div>
                      )}
                    </AspectRatio>
                  </div>

                  {/* Info */}
                  <div className={cn(STYLES.infoWrapper, "p-4")}>
                    <TypographyH2 className={STYLES.productName}>
                      <HighlightedText
                        text={product.name}
                        queryTokens={queryTokens}
                      />
                    </TypographyH2>
                    {product.sku && (
                      <span className={STYLES.sku}>
                        <HighlightedText
                          text={product.sku}
                          queryTokens={queryTokens}
                        />
                      </span>
                    )}
                    <div className={STYLES.priceWrapper}>
                      <span className={STYLES.salePrice}>
                        {formatPrice(
                          product.salePrice || product.originalPrice || 0,
                        )}
                      </span>
                      {product.discountPercent > 0 && (
                        <div className={STYLES.originalPriceWrapper}>
                          <span className={STYLES.originalPrice}>
                            {formatPrice(product.originalPrice || 0)}
                          </span>
                          <Badge className={STYLES.discountBadge}>
                            -{product.discountPercent}
                            <Percent className="w-3 h-3" strokeWidth={3} />
                          </Badge>
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
            <p className={STYLES.emptyText}>
              {isSearchActive
                ? "Không tìm thấy sản phẩm phù hợp."
                : "Hiện chưa có sản phẩm nào."}
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className={STYLES.paginationWrapper}>
            <ProductPagination
              currentPage={currentPage}
              totalPages={totalPages}
              searchQuery={q || undefined}
              categorySlug={categorySlug || undefined}
              minPrice={minPrice ?? undefined}
              maxPrice={maxPrice ?? undefined}
            />
          </div>
        )}

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
    </main>
  );
}
