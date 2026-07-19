import Image from "next/image";
import { notFound } from "next/navigation";
import { primaryImageUrl } from "@/shared/lib/image-asset";

import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";

import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { PRODUCT_STATUS, ProductSortBy } from "@/modules/catalog/domain";
import { ProductGrid } from "@/modules/catalog/presentation/components/ProductGrid";
import { ProductFilterDialogButton } from "@/modules/catalog/presentation/components/public/ProductFilterDialogButton";
import { ProductSearchBox } from "@/modules/catalog/presentation/components/public/ProductSearchBox";
import { ProductSortSelect } from "@/modules/catalog/presentation/components/public/ProductSortSelect";
import { ResolvedEntity } from "@/modules/catalog/presentation/resolveProductPath";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { CompareLinkButton } from "@/shared/components/layout/user/compare-link-button";
import { ProductDescription } from "@/shared/components/layout/user/product-description";
import { WishlistDialogButton } from "@/shared/components/layout/user/wishlist-dialog-button";
import { RecentlyViewedSection } from "@/shared/components/layout/user/recently-viewed-section";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { TypographyH1, TypographySmall } from "@/shared/components/ui/typography";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { BASE_URL } from "@/shared/lib/seo-schema";

// No pagination/infinite-scroll — renders the full matching catalog for the
// category/brand/group in one shot (small catalog, largest single category
// ~59 products).
const LIST_LIMIT = 1000;

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

interface ProductListModuleProps {
  entity: ResolvedEntity;
  searchParams?: SearchParams;
}

async function getCachedListModuleData(entity: ResolvedEntity, sp: SearchParams) {
  if (!entity) {
    throw new Error("Entity is required");
  }

  let categoryIds: string[] | undefined;
  let brandIds: string[] | undefined;
  let showBrandFacet = true;
  let breadcrumbParent: { label: string; href: string } | null = null;

  const allCategories = await getCategoriesAction().then(unwrapActionResult);

  if (entity.type === "brand") {
    brandIds = [entity.data.id];
    showBrandFacet = false; // page itself is already brand-scoped
  } else if (entity.type === "category") {
    categoryIds = [entity.data.id];
    if (entity.data.group) {
      breadcrumbParent = {
        label: entity.data.group.name,
        href: `/san-pham/${entity.data.group.slug}`,
      };
    }
  } else if (entity.type === "group") {
    categoryIds = allCategories
      .filter((c) => c.groupId === entity.data.id && !c.isHidden)
      .map((c) => c.id);
  }

  // Brand-facet selection from the filter dialog only applies on
  // non-brand-scoped pages (category/group) — a brand page's own scope
  // always wins, the dialog doesn't even show the brand facet there.
  const brandFacetIds = firstParam(sp, "brand_ids")?.split(",").filter(Boolean);
  if (showBrandFacet && brandFacetIds && brandFacetIds.length > 0) {
    brandIds = brandFacetIds;
  }

  const search = firstParam(sp, "search");
  const minPriceRaw = firstParam(sp, "min_price");
  const maxPriceRaw = firstParam(sp, "max_price");
  const sortByRaw = firstParam(sp, "sort_by");

  const attributeTokens: Record<string, string[]> = {};
  const attributeRanges: Record<string, [number | undefined, number | undefined]> = {};
  for (const [key, rawValue] of Object.entries(sp)) {
    if (!key.startsWith("attr_") || rawValue === undefined) continue;
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    const code = key.slice(5);
    if (code.endsWith("_min")) {
      const c = code.slice(0, -4);
      attributeRanges[c] = [Number(value), attributeRanges[c]?.[1]];
    } else if (code.endsWith("_max")) {
      const c = code.slice(0, -4);
      attributeRanges[c] = [attributeRanges[c]?.[0], Number(value)];
    } else {
      attributeTokens[code] = value.split(",").filter(Boolean);
    }
  }

  const { data: products, totalCount, facets } = await getProductsAction({
    categoryIds,
    brandIds,
    status: PRODUCT_STATUS.PUBLISHED,
    limit: LIST_LIMIT,
    search,
    minPrice: minPriceRaw ? Number(minPriceRaw) : undefined,
    maxPrice: maxPriceRaw ? Number(maxPriceRaw) : undefined,
    sortBy: sortByRaw as ProductSortBy | undefined,
    attributeTokens: Object.keys(attributeTokens).length > 0 ? attributeTokens : undefined,
    attributeRanges: Object.keys(attributeRanges).length > 0 ? attributeRanges : undefined,
  });

  return {
    products,
    totalCount,
    facets,
    showBrandFacet,
    currentBrandIds: brandFacetIds ?? [],
    currentMinPrice: minPriceRaw ?? "",
    currentMaxPrice: maxPriceRaw ?? "",
    currentAttrTokens: attributeTokens,
    currentAttrRanges: Object.fromEntries(
      Object.entries(attributeRanges).map(([code, [min, max]]) => [
        code,
        [min !== undefined ? String(min) : "", max !== undefined ? String(max) : ""] as [string, string],
      ]),
    ),
    breadcrumbParent,
    currentYear: new Date().getFullYear(),
  };
}

export async function ProductListModule({
  entity,
  searchParams = {},
}: ProductListModuleProps) {
  if (!entity || entity.type === "product") return notFound();

  const pageTitle = entity.data.name;
  const heroImageUrl = entity.type === "brand" ? entity.data.logoUrl : entity.data.imageUrl;
  const heroContent = entity.data.content;
  const warrantyPolicy = entity.type === "brand" ? entity.data.warrantyPolicy : null;

  const {
    products,
    totalCount,
    facets,
    showBrandFacet,
    currentBrandIds,
    currentMinPrice,
    currentMaxPrice,
    currentAttrTokens,
    currentAttrRanges,
    breadcrumbParent,
    currentYear,
  } = await getCachedListModuleData(entity, searchParams);

  return (
    <main className="w-full bg-background min-h-screen public-catalog-page">
      <div className="w-full flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-350 mx-auto">
        <Breadcrumbs
          items={[
            { label: "Sản phẩm", href: "/san-pham" },
            ...(breadcrumbParent ? [breadcrumbParent] : []),
            { label: pageTitle, href: `/san-pham/${entity.data.slug}`, active: true },
          ]}
        />

        <div className="flex flex-col gap-4 pb-6 border-b border-dashed border-border/40">
          <div className="flex items-center gap-4">
            {heroImageUrl && (
              <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white border border-border/50">
                <Image
                  src={heroImageUrl}
                  alt={pageTitle}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <TypographyH1>{pageTitle}</TypographyH1>
          </div>

          {warrantyPolicy && (
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm">
              <ShieldCheck className="shrink-0 translate-y-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">Chính sách bảo hành</span>
                <span className="text-muted-foreground text-balance">{warrantyPolicy}</span>
              </div>
            </div>
          )}
        </div>

        <RecentlyViewedSection />

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-0">
            <ProductSearchBox />
          </div>

          <div className="order-2 sm:order-4">
            <ProductFilterDialogButton
              brands={facets.brands}
              showBrandFacet={showBrandFacet}
              currentBrandIds={currentBrandIds}
              price={facets.price}
              currentMinPrice={currentMinPrice}
              currentMaxPrice={currentMaxPrice}
              attributes={facets.attributes}
              currentAttrTokens={currentAttrTokens}
              currentAttrRanges={currentAttrRanges}
            />
          </div>

          {/* forces Wishlist/Compare/Sort onto their own line on mobile only */}
          <div className="basis-full order-3 sm:hidden" />

          <div className="order-4 sm:order-2">
            <WishlistDialogButton />
          </div>
          {totalCount >= 2 && (
            <div className="order-5 sm:order-3">
              <CompareLinkButton />
            </div>
          )}

          <div className="order-6 sm:order-5">
            <ProductSortSelect />
          </div>
        </div>

        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="py-24 text-center min-h-75 w-full">
            <p className="text-muted-foreground/60 italic text-sm">
              Không tìm thấy sản phẩm nào.
            </p>
          </div>
        )}

        {/* Đặt sau lưới sản phẩm, không phải trước — người xem trang danh
            mục cần thấy sản phẩm trước tiên; nội dung mô tả chỉ dành cho ai
            muốn tìm hiểu thêm, nên không nên chắn đường mua trước lưới. */}
        {heroContent ? (
          <ProductDescription content={heroContent} fallbackAlt={pageTitle} variant="hero" />
        ) : null}
      </div>

      <div className="w-full max-w-350 mx-auto px-4 md:px-6 lg:px-8 py-6 border-t border-dashed border-border/40">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </div>
      </div>

      {/* BreadcrumbList JSON-LD is emitted by <Breadcrumbs> above, from the
          same items — not duplicated here. */}
      {(() => {
        const pageUrl = `${BASE_URL}/san-pham/${entity.data.slug}`;

        const collectionPageSchema = {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: pageTitle,
          url: pageUrl,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: totalCount,
            itemListElement: products.map((p, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              url: `${BASE_URL}/san-pham/${p.slug}`,
              name: p.name,
              image: primaryImageUrl(p.images) || undefined,
            })),
          },
        };

        return (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
          />
        );
      })()}
    </main>
  );
}
