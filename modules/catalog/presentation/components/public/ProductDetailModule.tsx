import { ProductWithRelations, resolveProductDisplayPrice, resolveDefaultVariant, formatAttributeValue } from "@/modules/catalog/domain";
import { ProductGrid } from "@/modules/catalog/presentation/components/ProductGrid";
import { ProductImageGallery } from "@/modules/catalog/presentation/components/public/ProductImageGallery";
import { ProductVariantSwitcher } from "@/modules/catalog/presentation/components/public/ProductVariantSwitcher";
import { getRelatedProducts } from "@/modules/catalog/presentation/getRelatedProducts";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { TrackView } from "@/modules/event";
import { getReviewsAction } from "@/modules/review";
import { ReviewSection } from "@/modules/review/presentation/components/ReviewSection";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { ExpandableContent } from "@/shared/components/layout/user/expandable-content";
import { ProductDescription } from "@/shared/components/layout/user/product-description";
import { ProductFloatingBar } from "@/shared/components/layout/user/product-floating-bar";
import { RecentlyViewedSection } from "@/shared/components/layout/user/recently-viewed-section";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { TrackProductView } from "@/shared/components/layout/user/track-product-view";
import { InView } from "@/shared/components/motion-primitives/in-view";
import { Badge } from "@/shared/components/ui/badge";
import { Item, ItemActions, ItemContent, ItemGroup, ItemSeparator, ItemTitle } from "@/shared/components/ui/item";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { cn } from "@/shared/lib/utils";
import { notFound } from "next/navigation";

const AVAILABILITY_SCHEMA: Record<string, string> = {
  in_stock: "https://schema.org/InStock",
  order_from_supplier: "https://schema.org/PreOrder",
  discontinued: "https://schema.org/Discontinued",
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
  const [relatedProducts, { data: reviews, aggregate }] = await Promise.all([
    getRelatedProducts(product),
    getReviewsAction("product", product.id),
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

              {product.shortDescription && (
                <TypographyLead className="text-muted-foreground">
                  {product.shortDescription}
                </TypographyLead>
              )}

              <ProductVariantSwitcher
                product={product}
                variants={product.variants || []}
                options={product.options || []}
                contacts={contacts || []}
                compareItem={compareItem}
              />
            </div>
          </div>
        </InView>
      </section>

      {/* ===== TABS: THÔNG SỐ / MÔ TẢ ===== */}
      <section className="w-full max-w-350 mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 border-t border-dashed border-border/40">
        {/* Floating CTA bar trigger — sits at the top of this section instead
            of right after the hero CTA, so on mobile (where the hero alone
            can exceed one viewport) the bar only appears once the user
            actually scrolls down to the specs/description tabs, not on
            first paint before they've seen the hero at all. */}
        <div id="product-cta-sentinel" aria-hidden="true" />
        <Tabs defaultValue={attributeGroups.length > 0 ? "specs" : "description"} className="w-full">
          <TabsList className="mx-auto w-fit">
            {attributeGroups.length > 0 && <TabsTrigger value="specs">Thông số kỹ thuật</TabsTrigger>}
            {product.description ? <TabsTrigger value="description">Mô tả sản phẩm</TabsTrigger> : null}
          </TabsList>

          {attributeGroups.length > 0 && (
            <TabsContent value="specs" className="pt-10 focus-visible:outline-none">
              {(() => {
                const specList = (
                  <div className="max-w-3xl mx-auto flex flex-col gap-6">
                    {attributeGroups.map((group) => (
                      <div key={group.label ?? "__chung__"} className="flex flex-col gap-2">
                        {group.label && (
                          <TypographyH2 className="text-base font-semibold">{group.label}</TypographyH2>
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
            </TabsContent>
          )}

          {product.description && (
            <TabsContent value="description" className="pt-10 focus-visible:outline-none">
              <div className="max-w-4xl mx-auto">
                <ProductDescription content={product.description} fallbackAlt={product.name} />
              </div>
            </TabsContent>
          )}

        </Tabs>
      </section>

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
            <TypographyH1 className="text-xl md:text-2xl font-bold tracking-tight">
              Sản phẩm liên quan
            </TypographyH1>
            <ProductGrid products={relatedProducts} />
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

        const hasDiscount = !!defaultVariant && defaultVariant.discountPercent > 0;

        const productSchema = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          image: images.map((img) => img.url),
          description: product.shortDescription || product.metaDescription || undefined,
          sku: defaultVariant?.sku || undefined,
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
                  reviewRating: { "@type": "Rating", ratingValue: r.rating },
                  author: { "@type": "Person", name: r.reviewerName },
                  reviewBody: r.comment,
                })),
              }
            : {}),
          // Google requires price > 0 for Merchant Listings eligibility — a
          // quote-only product (displayPrice 0/null) omits offers entirely
          // rather than emitting a literal 0.
          offers: finalPrice && finalPrice > 0
            ? {
                "@type": "Offer",
                url: pageUrl,
                priceCurrency: "VND",
                price: finalPrice,
                availability: AVAILABILITY_SCHEMA[product.displayStockStatus || ""] || "https://schema.org/InStock",
                // List price before discount — only meaningful when the
                // default variant is actually on sale.
                priceSpecification: hasDiscount
                  ? {
                      "@type": "UnitPriceSpecification",
                      priceType: "https://schema.org/ListPrice",
                      price: defaultVariant!.originalPrice,
                      priceCurrency: "VND",
                    }
                  : undefined,
              }
            : undefined,
        };

        // BreadcrumbList JSON-LD is emitted by <Breadcrumbs> above, from the
        // same breadcrumbItems — not duplicated here.

        return (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
        );
      })()}
    </main>
  );
}
