import Image from "next/image";
import Link from "next/link";
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
import { CategoryWithGroup } from "@/modules/category/domain/types";
import { HpPage } from "@/modules/hp-page/domain/types";
import { getHpPagesAction } from "@/modules/hp-page/presentation/actions";
import { getPersonalizedShippingZoneAction } from "@/modules/shipping-zone";
import { Breadcrumbs } from "@/shared/components/organisms/layout/user/breadcrumbs";
import { CompareLinkButton } from "@/shared/components/organisms/layout/user/compare-link-button";
import { ProductDescription } from "@/shared/components/organisms/layout/user/product-description";
import { PreviewContent } from "@/shared/components/organisms/layout/user/preview-content";
import { WishlistDialogButton } from "@/shared/components/organisms/layout/user/wishlist-dialog-button";
import { RecentlyViewedSection } from "@/shared/components/organisms/layout/user/recently-viewed-section";
import { ScrollToTop } from "@/shared/components/organisms/layout/user/scroll-to-top";
import { ScrollArea, ScrollBar } from "@/shared/components/ui/scroll-area";
import { TypographyH1, TypographyH3, TypographySmall } from "@/shared/components/ui/typography";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { BASE_URL, toJsonLdHtml } from "@/shared/lib/seo-schema";

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
  // Only populated for entity.type "group" — its direct child categories
  // (e.g. "Máy lạnh treo tường", "Máy lạnh âm trần"), rendered as their own
  // "Loại lắp đặt" quick-nav group below. These already had a real link
  // (the site-wide "Danh mục Sản phẩm" footer), just not one near the H1 —
  // unlike hp_pages below, this isn't an orphan-link fix, just weak
  // placement.
  let childCategories: CategoryWithGroup[] = [];

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
    childCategories = allCategories.filter((c) => c.groupId === entity.data.id && !c.isHidden);
    categoryIds = childCategories.map((c) => c.id);
  } else if (entity.type === "hp_page") {
    if (entity.data.categoryIds.length > 0) categoryIds = entity.data.categoryIds;
    if (entity.data.brandIds.length > 0) {
      brandIds = entity.data.brandIds;
      showBrandFacet = false; // page itself is already brand-scoped
    }
  }
  // hp_page's attributeCode/attributeValues filter is merged into
  // attributeTokens below, once that record exists.

  // Snapshot the entity's OWN scope before brand_ids query-param filtering
  // (below) can reassign `brandIds` — related-hp_pages matching (after the
  // product fetch, once `facets` exists) must key off what this page IS,
  // not off a visitor's transient filter selection.
  const entityCategoryIds = categoryIds ?? [];
  const entityBrandIds = brandIds ?? [];

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
  // hp_page's own filter is fixed by the page, not the visitor — set it
  // first, then skip any query-param value for that same code below so a
  // crafted URL can't override the page's locked capacity filter.
  const hpPageAttributeCode = entity.type === "hp_page" ? entity.data.attributeCode : null;
  if (entity.type === "hp_page" && hpPageAttributeCode) {
    attributeTokens[hpPageAttributeCode] = entity.data.attributeValues;
  }
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
    } else if (code !== hpPageAttributeCode) {
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

  // Related hp_pages (curated attribute/category/brand landing pages, e.g.
  // "Máy lạnh 1HP", "Máy lạnh Daikin") for THIS category/group/brand/
  // hp_page — rendered as real <Link>s on the page below. Before this,
  // these pages existed only in the sitemap
  // (app/sitemap/categories.xml/route.ts) with no on-site link pointing to
  // them anywhere, so they got near-zero crawl/PageRank despite being
  // properly indexable (unique title/description/canonical) — found
  // 2026-09-27 auditing /san-pham/may-lanh's weak GSC signal.
  let relatedHpPages: HpPage[] = [];
  if (entity.type === "category" || entity.type === "group" || entity.type === "brand" || entity.type === "hp_page") {
    const { data: allHpPages } = await getHpPagesAction();

    if (entity.type === "hp_page") {
      // Sibling pages segmenting the same attribute (e.g. the 12 "phân khúc
      // HP" pages) — group purely by attributeCode. These are typically NOT
      // category/brand-scoped (categoryIds/brandIds both empty, see below),
      // so matching on scope overlap like the branch below would miss every
      // sibling.
      relatedHpPages = allHpPages.filter(
        (p) => p.id !== entity.data.id && p.attributeCode !== null && p.attributeCode === entity.data.attributeCode,
      );
    } else {
      // Attribute-only hp_pages (no categoryIds/brandIds — e.g. the 12
      // "máy lạnh Nhp" pages) aren't explicitly scoped to a category, so
      // infer relevance from whether that attribute actually appears on
      // products in THIS listing (facets already reflect this listing's own
      // categoryIds/brandIds scope). Applied at "group" (/san-pham/may-lanh)
      // AND "brand" (/san-pham/lg) level — GSC confirmed real search volume
      // for "<brand> <HP>" queries (2026-09-27) — but not on every narrower
      // subcategory (e.g. "treo tường"), which would otherwise link out to
      // HP values that don't actually fit that subcategory.
      const listingAttributeCodes =
        entity.type === "group" || entity.type === "brand" ? new Set(facets.attributes.map((a) => a.code)) : null;

      relatedHpPages = allHpPages.filter((p) => {
        const scopedByCategory = p.categoryIds.some((id) => entityCategoryIds.includes(id));
        const scopedByBrand = p.brandIds.some((id) => entityBrandIds.includes(id));
        const scopedByAttributeOnly =
          listingAttributeCodes !== null &&
          p.categoryIds.length === 0 &&
          p.brandIds.length === 0 &&
          p.attributeCode !== null &&
          listingAttributeCodes.has(p.attributeCode);
        return scopedByCategory || scopedByBrand || scopedByAttributeOnly;
      });
    }

    relatedHpPages = relatedHpPages.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }

  // Group the quick-nav links into labeled sections — "Loại lắp đặt" (real
  // categories), one section per attribute code among the hp_pages found
  // above (e.g. "Công suất (HP)"; label comes from the attribute's own
  // facet name, not hardcoded, so a future attribute-based hp_page family
  // gets a correct heading for free), and "Thương hiệu" for the
  // brand/category combo pages (attributeCode null, e.g. "Máy lạnh
  // Daikin"). Plain flat chips made the different kinds of links (a real
  // taxonomy category vs. a curated attribute segment vs. a brand combo)
  // read as one undifferentiated group — this keeps that distinction
  // visible in the markup (h3 per group), not just in code.
  interface QuickNavItem {
    id: string;
    slug: string;
    /** Full, real name (e.g. "Máy lạnh treo tường") — used for aria-label
     * and as the fallback display text, never shortened. */
    name: string;
    /** What's actually shown on the chip — starts equal to `name`, then
     * possibly shortened below. Kept separate from `name` instead of
     * overwriting it in place, so the full name survives for aria-label. */
    label: string;
  }
  interface QuickNavGroup {
    label: string;
    items: QuickNavItem[];
  }
  const quickNavGroups: QuickNavGroup[] = [];

  if (childCategories.length > 0) {
    quickNavGroups.push({
      label: "Loại lắp đặt",
      items: childCategories.map((c) => ({ id: c.id, slug: c.slug, name: c.name, label: c.name })),
    });
  }

  if (relatedHpPages.length > 0) {
    const attributeNameByCode = new Map(facets.attributes.map((a) => [a.code, a.name]));
    const byAttributeCode = new Map<string, HpPage[]>();
    const brandComboPages: HpPage[] = [];

    for (const p of relatedHpPages) {
      if (p.attributeCode) {
        const list = byAttributeCode.get(p.attributeCode) ?? [];
        list.push(p);
        byAttributeCode.set(p.attributeCode, list);
      } else {
        brandComboPages.push(p);
      }
    }

    for (const [code, pages] of byAttributeCode) {
      quickNavGroups.push({
        label: attributeNameByCode.get(code) ?? code,
        items: pages.map((p) => ({ id: p.id, slug: p.slug, name: p.name, label: p.name })),
      });
    }

    if (brandComboPages.length > 0) {
      quickNavGroups.push({
        label: "Thương hiệu",
        items: brandComboPages.map((p) => ({ id: p.id, slug: p.slug, name: p.name, label: p.name })),
      });
    }
  }

  // Every item name in this family repeats the same leading word(s) (e.g.
  // "Máy lạnh treo tường", "Máy lạnh 1HP", "Máy lạnh Daikin" all start with
  // "Máy lạnh") — the group heading above already says what family this is,
  // so repeating it in every single chip only adds length. On mobile this
  // wrapped chips onto many extra lines and visibly lengthened the page.
  // Strip whatever leading words are common to EVERY item across ALL groups
  // (not hardcoded to "Máy lạnh" — works the same for any other product
  // family), falling back to the full name for any item that doesn't
  // actually share it. Only `label` (the visible chip text) is shortened —
  // `name` stays the real full name, used below for each Link's
  // aria-label, so a screen reader (and Google, which does read aria-label
  // as a link-text signal) still gets "Máy lạnh treo tường", not just
  // "Treo tường" stripped of the context its group heading provides.
  const allQuickNavNames = quickNavGroups.flatMap((g) => g.items.map((i) => i.name));
  if (allQuickNavNames.length > 1) {
    const wordLists = allQuickNavNames.map((n) => n.trim().split(/\s+/));
    let sharedWordCount = 0;
    outer: for (let i = 0; i < wordLists[0].length; i++) {
      for (const words of wordLists) {
        if (words[i] !== wordLists[0][i]) break outer;
      }
      sharedWordCount++;
    }
    if (sharedWordCount > 0) {
      const prefix = wordLists[0].slice(0, sharedWordCount).join(" ");
      for (const group of quickNavGroups) {
        for (const item of group.items) {
          if (item.label.startsWith(`${prefix} `)) {
            const rest = item.label.slice(prefix.length + 1);
            // "treo tường" was a mid-name word in "Máy lạnh treo tường",
            // correctly lowercase there — standing alone as its own chip
            // now, it needs a capital like any other label (already true
            // for "Daikin"/"1HP", only the plain-category names need this).
            item.label = rest.charAt(0).toUpperCase() + rest.slice(1);
          }
        }
      }
    }
  }

  return {
    products,
    totalCount,
    facets,
    quickNavGroups,
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
    quickNavGroups,
    showBrandFacet,
    currentBrandIds,
    currentMinPrice,
    currentMaxPrice,
    currentAttrTokens,
    currentAttrRanges,
    breadcrumbParent,
    currentYear,
  } = await getCachedListModuleData(entity, searchParams);
  const { data: shippingZone } = await getPersonalizedShippingZoneAction();

  // Hide the facet the page itself is already locked to — same reasoning
  // as showBrandFacet=false for brand pages, just for one attribute code
  // instead of the whole brand block.
  const visibleAttributeFacets =
    entity.type === "hp_page"
      ? facets.attributes.filter((a) => a.code !== entity.data.attributeCode)
      : facets.attributes;

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

          {quickNavGroups.length > 0 && (
            <nav aria-label="Xem nhanh theo phân khúc" className="flex flex-col gap-3">
              {quickNavGroups.map((group) => (
                <div key={group.label} className="flex flex-col gap-1.5">
                  <TypographyH3 className="text-sm font-medium text-muted-foreground">{group.label}</TypographyH3>
                  {/* Horizontal scroll instead of wrap — a group like "Phân
                      khúc công suất (HP)" has 12 items, and wrapping them
                      pushed the whole page taller on mobile before a user
                      even reaches the product grid. */}
                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max gap-2 pb-2.5">
                      {group.items.map((item) => (
                        <Link
                          key={item.id}
                          href={`/san-pham/${item.slug}`}
                          aria-label={item.name}
                          className="shrink-0 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              ))}
            </nav>
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
              attributes={visibleAttributeFacets}
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
          <ProductGrid products={products} shippingZone={shippingZone} />
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
          <ProductDescription variant="hero">
            <PreviewContent content={heroContent} fallbackAlt={pageTitle} size="sm" className="typeset-hero" />
          </ProductDescription>
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
            dangerouslySetInnerHTML={{ __html: toJsonLdHtml(collectionPageSchema) }}
          />
        );
      })()}
    </main>
  );
}
