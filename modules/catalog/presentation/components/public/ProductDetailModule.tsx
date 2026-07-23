import { ProductWithRelations, resolveProductDisplayPrice, resolveDefaultVariant, formatAttributeValue } from "@/modules/catalog/domain";
import { ProductGrid } from "@/modules/catalog/presentation/components/ProductGrid";
import { ProductImageGallery } from "@/modules/catalog/presentation/components/public/ProductImageGallery";
import { ProductVariantSwitcher } from "@/modules/catalog/presentation/components/public/ProductVariantSwitcher";
import { getRelatedProducts } from "@/modules/catalog/presentation/getRelatedProducts";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { TrackView } from "@/modules/event";
import { getReviewsAction } from "@/modules/review";
import { ReviewSection } from "@/modules/review/presentation/components/ReviewSection";
import { getProductLineByIdAction } from "@/modules/product-line/presentation/actions";
import { getCategoryByIdAction } from "@/modules/category/presentation/actions";
import { getDefaultShippingZoneAction, getPersonalizedShippingZoneAction } from "@/modules/shipping-zone";
import { getSavedProvinceCode, getSavedWardCode } from "@/modules/shipping-zone/presentation/delivery-cookie";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { ExpandableContent } from "@/shared/components/layout/user/expandable-content";
import { ProductDescription } from "@/shared/components/layout/user/product-description";
import { ProductFloatingBar } from "@/shared/components/layout/user/product-floating-bar";
import { RecentlyViewedSection } from "@/shared/components/layout/user/recently-viewed-section";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { TrackProductView } from "@/shared/components/layout/user/track-product-view";
import { InView } from "@/shared/components/motion-primitives/in-view";
import { Badge } from "@/shared/components/ui/badge";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { Item, ItemActions, ItemContent, ItemGroup, ItemSeparator, ItemTitle } from "@/shared/components/ui/item";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import { BASE_URL, toJsonLdHtml } from "@/shared/lib/seo-schema";
import { cn } from "@/shared/lib/utils";
import { notFound } from "next/navigation";

const AVAILABILITY_SCHEMA: Record<string, string> = {
  in_stock: "https://schema.org/InStock",
  order_from_supplier: "https://schema.org/PreOrder",
  discontinued: "https://schema.org/Discontinued",
};

const CONDITION_SCHEMA: Record<string, string> = {
  "Mới": "https://schema.org/NewCondition",
  "Cũ": "https://schema.org/UsedCondition",
};

// ELC: no returns accepted, free shipping nationwide — reflect the real
// business policy here (Google penalizes inaccurate return/shipping markup),
// not a guessed/default value.
const MERCHANT_RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "VN",
  returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
};

async function getCachedProductDetailData() {
  const { data: rawContacts } = await getContactsAction();
  const contacts = (rawContacts || []).filter((c) => c.isActive);

  return {
    contacts,
    currentYear: new Date().getFullYear(),
  };
}

export async function ProductDetailModule({
  product,
}: {
  product: ProductWithRelations;
}) {
  const { contacts, currentYear } = await getCachedProductDetailData();
  const [relatedProducts, { data: reviews, aggregate }, { data: productLine }, { data: categoryWithGroup }, { data: defaultShippingZone }, savedProvinceCode, savedWardCode, { data: personalizedShippingZone }] = await Promise.all([
    getRelatedProducts(product),
    getReviewsAction("product", product.id),
    product.productLineId ? getProductLineByIdAction(product.productLineId) : Promise.resolve({ data: null }),
    product.category?.id ? getCategoryByIdAction(product.category.id) : Promise.resolve({ data: null }),
    getDefaultShippingZoneAction(),
    getSavedProvinceCode(),
    getSavedWardCode(),
    getPersonalizedShippingZoneAction(),
  ]);

  const category = product.category;
  if (!category) notFound();

  // Structured attribute values (see modules/attribute-definition) — the
  // primary source of truth for specs now, replacing the free-text
  // products.specs jsonb the admin used to hand-type.
  const attributeGroups = (() => {
    const rows = (product.attributeValues || []).filter(
      (av) =>
        av.valueText ||
        av.valueNumber != null ||
        av.valueBoolean != null ||
        (av.valueOptions && av.valueOptions.length > 0),
    );
    const groups: { label: string | null; rows: typeof rows }[] = [];
    for (const av of rows) {
      let group = groups.find((g) => g.label === (av.groupLabel ?? null));
      if (!group) {
        group = { label: av.groupLabel ?? null, rows: [] };
        groups.push(group);
      }
      group.rows.push(av);
    }
    return groups;
  })();
  const totalSpecRows = attributeGroups.reduce((sum, g) => sum + g.rows.length, 0);
  // Only collapse when the table is actually long enough to need it — a
  // 3-row spec list doesn't need a "Xem thêm" button under it.
  const SPEC_COLLAPSE_THRESHOLD = 8;
  const highlights = (product.highlights || []).filter((h) => h.trim());
  const hasHighlights = highlights.length > 0;
  const hasSpecs = attributeGroups.length > 0;
  // displayPrice (default-variant cache, see elc-go/docs/product-v2-design.md)
  // is the source of truth once a product has real variants — used here for
  // the floating CTA bar / recently-viewed snapshot, which (unlike
  // ProductVariantSwitcher below) don't track the customer's live selection.
  const finalPrice = resolveProductDisplayPrice(product);
  const defaultVariant = resolveDefaultVariant(product);
  const images = product.images || [];
  const compareItem = { id: product.id, name: product.name, slug: product.slug, categoryId: product.categoryId };

  const breadcrumbItems = [
    { label: "Sản phẩm", href: "/san-pham" },
    { label: category.name, href: `/san-pham/${category.slug}` },
    { label: product.name, href: `/san-pham/${product.slug}`, active: true },
  ];

  return (
    <main className="w-full bg-background min-h-screen flex flex-col">
      <TrackProductView productId={product.id} />
      <TrackView entityType="product" entityId={product.id} entityName={product.name} />

      <div className="w-full max-w-350 mx-auto px-4 md:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* ===== HERO: ẢNH + THÔNG TIN SẢN PHẨM ===== */}
      <section className="w-full max-w-350 mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10">
        <InView
          viewOptions={{ once: true }}
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <ProductImageGallery
              productId={product.id}
              images={images}
              fallbackAlt={`${product.name} ${defaultVariant?.sku ? `(${defaultVariant.sku})` : ""} - ${product.brand?.name || "ELC"} - Điện máy ELC`}
            />

            <div className="flex flex-col gap-4">
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline">{tag.name}</Badge>
                  ))}
                </div>
              )}

              <TypographyH1 className="w-full max-w-none text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight wrap-break-word leading-[1.15]">
                {product.name}
              </TypographyH1>

              <ProductVariantSwitcher
                product={product}
                variants={product.variants || []}
                options={product.options || []}
                contacts={contacts || []}
                compareItem={compareItem}
                savedProvinceCode={savedProvinceCode}
                savedWardCode={savedWardCode}
              />
            </div>
          </div>
        </InView>
      </section>

      {/* ===== THÔNG SỐ KỸ THUẬT / MÔ TẢ SẢN PHẨM =====
          Stacked sections, not tabs — both are always present in the
          server-rendered DOM. A tabbed layout only mounts the active
          panel's content client-side, so Googlebot (which renders JS but
          never clicks) only ever saw whichever panel was the default —
          the other one was invisible to indexing. */}
      {(hasHighlights || hasSpecs || product.description) && (
        <section className="w-full max-w-350 mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 border-t border-dashed border-border/40">
          {/* Floating CTA bar trigger — sits at the top of this section instead
              of right after the hero CTA, so on mobile (where the hero alone
              can exceed one viewport) the bar only appears once the user
              actually scrolls down to the specs/description, not on
              first paint before they've seen the hero at all. */}
          <div id="product-cta-sentinel" aria-hidden="true" />

          <div className="flex flex-col gap-12 md:gap-16">
            {hasHighlights && (
              <div>
                <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight text-center mb-8">
                  Đặc điểm nổi bật
                </TypographyH2>
                <ul className="max-w-3xl mx-auto flex flex-col gap-3">
                  {highlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-primary" />
                      <span className="text-sm md:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasSpecs && (
              <div
                className={cn(hasHighlights && "pt-12 md:pt-16 border-t border-dashed border-border/40")}
              >
                <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight text-center mb-8">
                  Thông số kỹ thuật
                </TypographyH2>
                {(() => {
                  const specList = (
                    <div className="max-w-3xl mx-auto flex flex-col gap-6">
                      {attributeGroups.map((group) => (
                        <div key={group.label ?? "__chung__"} className="flex flex-col gap-2">
                          {group.label && (
                            <TypographyH3 className="text-base font-semibold">{group.label}</TypographyH3>
                          )}
                          <ItemGroup className="rounded-xl border border-border/50 overflow-hidden bg-white/50">
                            {group.rows.map((av, i) => (
                              <div key={av.id}>
                                <Item size="sm">
                                  <ItemContent>
                                    <ItemTitle className="text-muted-foreground font-normal">{av.name}</ItemTitle>
                                  </ItemContent>
                                  <ItemActions>
                                    <span className="text-sm font-medium">{formatAttributeValue(av)}</span>
                                  </ItemActions>
                                </Item>
                                {i < group.rows.length - 1 && <ItemSeparator className="my-0" />}
                              </div>
                            ))}
                          </ItemGroup>
                        </div>
                      ))}
                    </div>
                  );

                  return totalSpecRows > SPEC_COLLAPSE_THRESHOLD ? (
                    <ExpandableContent>{specList}</ExpandableContent>
                  ) : (
                    specList
                  );
                })()}
              </div>
            )}

            {product.description && (
              <div
                className={cn(
                  (hasHighlights || hasSpecs) && "pt-12 md:pt-16 border-t border-dashed border-border/40",
                )}
              >
                <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight text-center mb-8">
                  Mô tả sản phẩm
                </TypographyH2>
                <div className="max-w-4xl mx-auto">
                  <ProductDescription content={product.description} fallbackAlt={product.name} />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== SẢN PHẨM ĐÃ XEM =====
          No border-t here (unlike the sections around it) — RecentlyViewedSection
          renders null client-side when there's no history, and this section's
          presence can't be checked server-side, so a static divider would be
          left dangling above the review section on a first-time visit. */}
      <section className="w-full max-w-350 mx-auto px-4 md:px-6 lg:px-8 pt-6 md:pt-10">
        <RecentlyViewedSection />
      </section>

      {/* ===== ĐÁNH GIÁ SẢN PHẨM ===== */}
      <section className="w-full max-w-350 mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 border-t border-dashed border-border/40">
        <ReviewSection
          entityType="product"
          entityId={product.id}
          entityName={product.name}
          entityImage={primaryImageUrl(images)}
          reviews={reviews}
          aggregate={aggregate}
        />
      </section>

      {/* ===== SẢN PHẨM LIÊN QUAN ===== */}
      {relatedProducts.length > 0 && (
        <section className="w-full max-w-350 mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 border-t border-dashed border-border/40">
          <div className="w-full flex flex-col gap-6">
            <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight">
              Sản phẩm liên quan
            </TypographyH2>
            <ProductGrid products={relatedProducts} shippingZone={personalizedShippingZone} />
          </div>
        </section>
      )}

      {/* ===== FOOTER BẢN QUYỀN ===== */}
      <section className="w-full max-w-350 mx-auto px-4 md:px-6 lg:px-8 py-6 border-t border-dashed border-border/40">
        <footer className={cn("w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground")}>
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </section>

      {/* ===== MOBILE FLOATING BAR ===== */}
      <ProductFloatingBar
        productId={product.id}
        productName={product.name}
        salePrice={finalPrice || 0}
        originalPrice={defaultVariant?.originalPrice || 0}
        discountPercent={defaultVariant?.discountPercent || 0}
        productImage={primaryImageUrl(images) || null}
        productSlug={product.slug}
        contacts={contacts}
      />

      {/* ===== JSON-LD ===== */}
      {(() => {
        const pageUrl = `${BASE_URL}/san-pham/${product.slug}`;

        // Structured spec rows for Rich Results/AI Overviews — mirrors the
        // spec tab above, sourced from attribute_values (not the retired
        // specs jsonb).
        const additionalProperty = attributeGroups.flatMap((g) => g.rows).map((av) => ({
          "@type": "PropertyValue",
          name: av.name,
          value: formatAttributeValue(av),
          ...(av.unit ? { unitText: av.unit } : {}),
        }));

        const conditionAv = (product.attributeValues || []).find((av) => av.code === "tinh_trang_san_pham");
        const conditionValue = conditionAv ? formatAttributeValue(conditionAv) : undefined;
        const itemCondition = CONDITION_SCHEMA[conditionValue || ""] || CONDITION_SCHEMA["Mới"];

        // variants.sku is warehouse shorthand for the indoor+outdoor unit
        // pair (e.g. "FTKB35ZVMV / RKB35ZVMV") — not a single merchant
        // identifier, so schema.org sku here takes just the indoor half
        // (the model customers actually search for) rather than that
        // slash-joined pair.
        const indoorSku = (sku: string) => sku.split("/")[0]?.trim() || undefined;

        const hasDiscount = !!defaultVariant && defaultVariant.discountPercent > 0;

        // Sourced from the admin-configured default shipping zone (see
        // modules/shipping-zone) instead of a hardcoded constant — this is
        // the site-wide default, not the customer's live address selection
        // from <DeliveryEstimate> on this same page (that can only run
        // client-side, after this JSON-LD has already been server-rendered).
        // Falls back to a free/no-estimate value only if no zone is
        // configured yet (shouldn't happen once the seed migration ran).
        const shippingDetails = {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: String(defaultShippingZone?.feeVnd ?? 0),
            currency: "VND",
          },
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "VN" },
          ...(defaultShippingZone
            ? {
                deliveryTime: {
                  "@type": "ShippingDeliveryTime",
                  // Order processing time before it leaves the warehouse —
                  // distinct from transitTime (carrier time to the buyer).
                  // Recommended by Google, not admin-configurable anywhere
                  // yet, so a fixed same-day/next-day default until there's
                  // an actual setting to source it from.
                  handlingTime: {
                    "@type": "QuantitativeValue",
                    minValue: 0,
                    maxValue: 1,
                    unitCode: "DAY",
                  },
                  transitTime: {
                    "@type": "QuantitativeValue",
                    minValue: defaultShippingZone.minDays,
                    maxValue: defaultShippingZone.maxDays,
                    unitCode: "DAY",
                  },
                },
              }
            : {}),
        };

        // Always a single Offer off the default variant, even for the small
        // set of products with >1 sellable variant (different Điện áp) —
        // Google's own guidance is that AggregateOffer isn't meant to
        // describe variants of one product (it's for the same product sold
        // by multiple merchants), and ProductGroup's variesBy has no
        // "voltage" dimension to fit this catalog's actual variant axis. A
        // single Offer keeps every page eligible for the Merchant Listing
        // rich result (Shopping tab, price/availability badge) at the cost
        // of the offer reflecting the default variant rather than whatever
        // the shopper has picked in the on-page switcher.
        const offers = finalPrice && finalPrice > 0
          ? {
              "@type": "Offer",
              url: pageUrl,
              priceCurrency: "VND",
              price: finalPrice,
              sku: defaultVariant?.sku ? indoorSku(defaultVariant.sku) : undefined,
              availability: AVAILABILITY_SCHEMA[product.displayStockStatus || ""] || "https://schema.org/InStock",
              itemCondition,
              hasMerchantReturnPolicy: MERCHANT_RETURN_POLICY,
              shippingDetails,
              priceSpecification: hasDiscount
                ? {
                    "@type": "UnitPriceSpecification",
                    priceType: "https://schema.org/ListPrice",
                    price: defaultVariant!.originalPrice,
                    priceCurrency: "VND",
                  }
                : undefined,
            }
          : undefined;

        const productSchema = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          url: pageUrl,
          // Google's Merchant Listing guidance recommends multiple aspect
          // ratios per image (16:9, 4:3, 1:1) — cropVariants (only present
          // for images uploaded after elc-go's crop-on-upload shipped) adds
          // the 4:3/1:1 derivatives right after each original 16:9 photo.
          image: images.flatMap((img) => [img.url, ...Object.values(img.cropVariants || {})]),
          description: product.metaDescription || undefined,
          // Google's documented format for a text category is a
          // breadcrumb-style hierarchy ("Group > Category") — group is the
          // parent (e.g. "Máy lạnh"), category the child (e.g. "Máy lạnh
          // treo tường"), matching the same nav hierarchy Breadcrumbs shows.
          category: categoryWithGroup?.group?.name
            ? `${categoryWithGroup.group.name} > ${category.name}`
            : category.name,
          sku: defaultVariant?.sku ? indoorSku(defaultVariant.sku) : undefined,
          mpn: defaultVariant?.mpn || undefined,
          gtin: defaultVariant?.gtin || undefined,
          model: productLine?.name || undefined,
          brand: product.brand?.name ? { "@type": "Brand", name: product.brand.name } : undefined,
          ...(additionalProperty.length > 0 ? { additionalProperty } : {}),
          // aggregateRating requires ratingCount >= 1 per Google's guidelines
          // — omit entirely rather than emit a hollow 0/0 for a product with
          // no reviews yet.
          ...(aggregate.count > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: aggregate.average,
                  reviewCount: aggregate.count,
                },
                review: reviews.slice(0, 10).map((r) => ({
                  "@type": "Review",
                  datePublished: r.createdAt,
                  reviewRating: { "@type": "Rating", ratingValue: r.rating },
                  author: { "@type": "Person", name: r.reviewerName },
                  reviewBody: r.comment,
                })),
              }
            : {}),
          offers,
        };

        // BreadcrumbList JSON-LD is emitted by <Breadcrumbs> above, from the
        // same breadcrumbItems — not duplicated here.

        return (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdHtml(productSchema) }} />
        );
      })()}
    </main>
  );
}
