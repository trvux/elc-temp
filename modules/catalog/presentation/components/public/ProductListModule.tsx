import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { primaryImageUrl } from "@/shared/lib/image-asset";

import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";

import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { PRODUCT_STATUS, ProductSortBy } from "@/modules/catalog/domain";
import { resolveProductDisplayPrice } from "@/modules/catalog/domain/price";
import { ProductGrid } from "@/modules/catalog/presentation/components/ProductGrid";
import { ProductFilterDialogButton } from "@/modules/catalog/presentation/components/public/ProductFilterDialogButton";
import { ProductSearchBox } from "@/modules/catalog/presentation/components/public/ProductSearchBox";
import { ProductSortSelect } from "@/modules/catalog/presentation/components/public/ProductSortSelect";
import { ResolvedEntity } from "@/modules/catalog/presentation/resolveProductPath";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { CategoryWithGroup } from "@/modules/category/domain/types";
import { HpPage } from "@/modules/hp-page/domain/types";
import { getHpPagesAction } from "@/modules/hp-page/presentation/actions";
import { FAQAccordion, getFAQsAction } from "@/modules/faq";
import { getPersonalizedShippingZoneAction } from "@/modules/shipping-zone";
import { Breadcrumbs } from "@/shared/components/organisms/layout/user/breadcrumbs";
import { CompareLinkButton } from "@/shared/components/organisms/layout/user/compare-link-button";
import { ProductDescription } from "@/shared/components/organisms/layout/user/product-description";
import { PreviewContent } from "@/shared/components/organisms/layout/user/preview-content";
import { WishlistDialogButton } from "@/shared/components/organisms/layout/user/wishlist-dialog-button";
import { RecentlyViewedSection } from "@/shared/components/organisms/layout/user/recently-viewed-section";
import { ScrollToTop } from "@/shared/components/organisms/layout/user/scroll-to-top";
import { TypographyH1, TypographyH3, TypographySmall } from "@/shared/components/ui/typography";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { AVAILABILITY_SCHEMA, BASE_URL, SEOSchema, toJsonLdHtml } from "@/shared/lib/seo-schema";

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

  // Brand pages don't have a fixed set of child categories the way a group
  // does (a brand can span any category) — derive "Loại lắp đặt" from
  // what its own products actually fall into, instead of leaving it empty
  // (found 2026-09-27: /san-pham/daikin and /san-pham/lg had no "Loại lắp
  // đặt" chip at all). `products` here is the brand's full catalog
  // (LIST_LIMIT, no pagination), so every category it touches is already
  // in hand — no extra query needed. Looked up in `allCategories` (not the
  // product's own embedded category, which lacks orderIndex) so sorting
  // matches every other "Loại lắp đặt" list on the site.
  if (entity.type === "brand" && childCategories.length === 0) {
    const seen = new Map<string, CategoryWithGroup>();
    for (const p of products) {
      if (p.category && !seen.has(p.category.id)) {
        const full = allCategories.find((c) => c.id === p.category!.id);
        if (full) seen.set(p.category.id, full);
      }
    }
    childCategories = Array.from(seen.values()).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }

  // Group's "Loại lắp đặt" was every child category with !isHidden, with no
  // check for whether it actually has any published products — unlike
  // every other quick-nav chip (HP, Thương hiệu), which all got fixed to
  // check real counts after the "máy lạnh 6hp"/"10hp" dead-page bug. Every
  // category happens to have products today (verified 2026-09-28: lowest
  // is 2), so this hadn't actually broken anything yet — fixed anyway for
  // the same reason, before a category going briefly empty recreates that
  // exact bug. `products` is already scoped to categoryIds = this group's
  // children, so the same category-derivation as the brand branch above
  // works here too, just filtering the existing list instead of building
  // a fresh one.
  if (entity.type === "group" && childCategories.length > 0) {
    const categoryIdsWithProducts = new Set(
      products.map((p) => p.category?.id).filter((id): id is string => !!id),
    );
    childCategories = childCategories.filter((c) => categoryIdsWithProducts.has(c.id));
  }

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
      // infer relevance from whether that EXACT value actually has products
      // in THIS listing — not just whether the attribute code appears at
      // all. Checking the code alone let dead values slip through: "máy
      // lạnh 6hp"/"máy lạnh 10hp" got linked despite the DB having zero
      // products at those two HP values (found 2026-09-27 — "phan_khuc_hp"
      // is a select attribute with only 1–5.5 HP actually used; 6/10 HP
      // were hp_pages created with no matching product ever tagged).
      // facets.attributes[].options carries the real per-value count for
      // exactly this reason — which is also what makes it safe to apply at
      // "category" level too (e.g. /san-pham/may-lanh-treo-tuong): the
      // per-value count check means it only ever shows HP values that
      // actually have wall-mount products, not just any HP value valid
      // somewhere in the wider "Máy lạnh" group. Before this fix (see the
      // comment above), category was deliberately excluded here because
      // matching by attribute CODE alone would have linked out to HP values
      // that don't fit that subcategory — that risk is gone now that the
      // match is per-value, not per-code (2026-09-27).
      const listingAttributeValues =
        entity.type === "group" || entity.type === "brand" || entity.type === "category"
          ? new Map(
              facets.attributes.map((a) => [
                a.code,
                new Set(a.options.filter((o) => o.count > 0).map((o) => o.value)),
              ]),
            )
          : null;

      relatedHpPages = allHpPages.filter((p) => {
        const scopedByCategory = p.categoryIds.some((id) => entityCategoryIds.includes(id));
        const scopedByBrand = p.brandIds.some((id) => entityBrandIds.includes(id));
        const validValuesForCode = p.attributeCode ? listingAttributeValues?.get(p.attributeCode) : undefined;
        const scopedByAttributeOnly =
          validValuesForCode !== undefined &&
          p.categoryIds.length === 0 &&
          p.brandIds.length === 0 &&
          p.attributeValues.length > 0 &&
          p.attributeValues.every((v) => validValuesForCode.has(v));
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
    // Category/brand-combo hp_pages (attributeCode null) — not used to build
    // the "Thương hiệu" section below anymore (see why right above it);
    // kept as a fallback only for the case that isn't a plain brand combo
    // (categoryIds set, brandIds empty — no such page exists today, but the
    // domain model allows it), so it doesn't just silently disappear.
    const nonBrandComboPages: HpPage[] = [];

    for (const p of relatedHpPages) {
      if (p.attributeCode) {
        const list = byAttributeCode.get(p.attributeCode) ?? [];
        list.push(p);
        byAttributeCode.set(p.attributeCode, list);
      } else if (p.brandIds.length === 0) {
        nonBrandComboPages.push(p);
      }
    }

    for (const [code, pages] of byAttributeCode) {
      quickNavGroups.push({
        label: attributeNameByCode.get(code) ?? code,
        items: pages.map((p) => ({ id: p.id, slug: p.slug, name: p.name, label: p.name })),
      });
    }

    if (nonBrandComboPages.length > 0) {
      quickNavGroups.push({
        label: "Danh mục khác",
        items: nonBrandComboPages.map((p) => ({ id: p.id, slug: p.slug, name: p.name, label: p.name })),
      });
    }
  }

  // "Thương hiệu" — which brands actually have products in THIS listing,
  // each linking to its own real brand page (/san-pham/<slug>), not a
  // category+brand combo hp_page. A combo hp_page for a brand that sells
  // only within one category (true of every brand in this catalog today)
  // ends up listing the exact same products as the brand page itself —
  // confirmed 2026-09-27 for Daikin (117/117 identical), two self-canonical
  // URLs splitting ranking signal for one thing. facets.brands already
  // reflects this listing's own category scope with real counts, so this
  // avoids that class of duplicate entirely instead of re-creating it.
  // Group AND category level (mirrors the HP attribute-only chips above) —
  // facets.brands is already scoped to exactly this listing's own
  // categoryIds, so a narrower category correctly shows only the brands
  // that actually carry that specific sub-type, not every brand in the
  // wider group.
  if (entity.type === "group" || entity.type === "category") {
    const brandItems = facets.brands
      .filter((b) => b.count > 0)
      .map((b) => ({ id: b.id, slug: b.slug, name: b.name, label: b.name }));
    if (brandItems.length > 0) {
      quickNavGroups.push({ label: "Thương hiệu", items: brandItems });
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

  // FAQ + FAQPage schema — brand/group/category, same infra product/service
  // already use (modules/faq, SEOSchema.getFAQPage). All 3 only just became
  // valid FAQ owner_types (elc-go migrations 2026-09-28, internal/faq).
  const faqs =
    entity.type === "brand" || entity.type === "group" || entity.type === "category"
      ? await getFAQsAction(entity.type, entity.data.id).then(unwrapActionResult)
      : [];

  return {
    products,
    totalCount,
    facets,
    quickNavGroups,
    faqs,
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
    faqs,
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
                      even reaches the product grid. Plain native overflow
                      instead of Radix's ScrollArea — that component's scroll
                      handling turned out to depend on its own <ScrollBar>
                      being mounted (removing it broke drag-scroll entirely,
                      found 2026-09-27), where a bare `overflow-x-auto` div
                      always scrolls via native touch/wheel/drag regardless
                      of whether the bar itself is visible; the 3 classes
                      below just hide that native bar cross-browser. */}
                  <div className="w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex w-max gap-2 pb-1">
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
                  </div>
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

        {faqs.length > 0 && (
          <section className="border-t border-dashed border-border/40 pt-6">
            <FAQAccordion faqs={faqs} />
          </section>
        )}
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

        // Nesting a full Product (with offers) under each ListItem, not just
        // name/url/image, is what Google's own Product-snippet docs call for
        // on a listing page — "Product properties should be nested under
        // itemListElement.item, including a nested Offer" — and is almost
        // certainly what drives the price-range line competitors (DMX,
        // CellphoneS) show under their own /may-lanh category result.
        // Confirmed live 2026-09-30 after the plain ListItem version here
        // (no nested Product/Offer at all) shipped no such line for ELC.
        const collectionPageSchema = {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: pageTitle,
          url: pageUrl,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: totalCount,
            itemListElement: products.map((p, idx) => {
              const itemUrl = `${BASE_URL}/san-pham/${p.slug}`;
              const price = resolveProductDisplayPrice(p);
              return {
                "@type": "ListItem",
                position: idx + 1,
                item: {
                  "@type": "Product",
                  name: p.name,
                  url: itemUrl,
                  image: primaryImageUrl(p.images) || undefined,
                  brand: p.brand?.name ? { "@type": "Brand", name: p.brand.name } : undefined,
                  ...(price > 0
                    ? {
                        offers: {
                          "@type": "Offer",
                          url: itemUrl,
                          priceCurrency: "VND",
                          price,
                          availability: AVAILABILITY_SCHEMA[p.displayStockStatus || ""] || "https://schema.org/InStock",
                        },
                      }
                    : {}),
                },
              };
            }),
          },
        };

        return (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: toJsonLdHtml(collectionPageSchema) }}
            />
            {faqs.length > 0 && (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: toJsonLdHtml({ "@context": "https://schema.org", ...SEOSchema.getFAQPage(faqs) }),
                }}
              />
            )}
          </>
        );
      })()}
    </main>
  );
}
