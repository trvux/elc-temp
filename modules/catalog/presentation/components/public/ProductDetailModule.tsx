import { ProductWithRelations, resolveProductDisplayPrice, resolveDefaultVariant, toLegacyStockStatusForBadge, btuToKw, CAPACITY_BTU_ATTRIBUTE_CODE } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { ProductVariantSwitcher } from "@/modules/catalog/presentation/components/public/ProductVariantSwitcher";
import { getRelatedProducts } from "@/modules/catalog/presentation/getRelatedProducts";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { TrackView } from "@/modules/event";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { ProductDescription } from "@/shared/components/layout/user/product-description";
import { ProductFloatingBar } from "@/shared/components/layout/user/product-floating-bar";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { TrackProductView } from "@/shared/components/layout/user/track-product-view";
import { GridSection } from "@/shared/components/sections/grid-section";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/components/ui/carousel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  TypographyH1,
  TypographyLarge,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import Image from "next/image";
import { notFound } from "next/navigation";

const STYLES = {
  main: cn("w-full bg-background min-h-screen flex flex-col"),
  topSection: cn(
    "grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start",
  ),
  imageArea: cn("space-y-4"),
  carouselWrapper: cn(
    "w-full bg-white border border-border/50 rounded-2xl overflow-hidden shadow-sm",
  ),
  carouselImage: cn("object-contain p-4"),
  noImage: cn(
    "w-full h-full flex items-center justify-center text-muted-foreground text-xs tracking-widest",
  ),
  infoArea: cn("flex flex-col gap-4 h-full justify-center"),
  productName: cn(
    "w-full max-w-none text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight wrap-break-word leading-[1.15]",
  ),
  subInfo: cn("flex flex-col gap-3"),
  priceArea: cn("space-y-2"),
  price: cn("text-3xl md:text-4xl font-bold text-foreground tracking-tight"),
  originalPriceWrapper: cn("flex items-center gap-2"),
  originalPrice: cn("text-md text-muted-foreground line-through"),

  tabsListWrapper: cn("mx-auto w-fit"),
  tabsContent: cn("pt-10 focus-visible:outline-none"),
  specsWrapper: cn("max-w-4xl mx-auto"),
  specsGrid: cn(
    "rounded-xl border border-border/50 overflow-hidden divide-y divide-border/40 bg-white/50",
  ),
  specHeader: cn(),
  specHeaderLabel: cn(),
  specRow: cn(
    "grid grid-cols-[1fr_1.5fr] bg-background hover:bg-muted/20 transition-colors",
  ),
  specLabel: cn("px-4 py-3.5 border-r border-border/40"),
  specLabelText: cn(),
  specValue: cn("px-4 py-3.5 flex flex-col gap-1"),
  specValueMain: cn(),
  specSubItem: cn(),
  specSubLabel: cn(),
  specUnit: cn("ml-1.5"),
  descriptionWrapper: cn("max-w-4xl mx-auto"),
  footer: cn(
    "w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
  relatedGrid: cn(
    "grid gap-x-4 gap-y-6 md:gap-y-12 content-start grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  ),
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
  const relatedProducts = await getRelatedProducts(product);

  const category = product.category;
  if (!category) notFound();

  // Structured attribute values (see modules/attribute-definition) — the
  // primary source of truth for specs now, replacing the free-text
  // products.specs jsonb the admin used to hand-type.
  const attributeGroups = (() => {
    const rows = (product.attributeValues || []).filter(
      (av) => av.valueText || av.valueNumber != null || av.valueBoolean != null,
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
  const formatAttributeValue = (av: (typeof attributeGroups)[number]["rows"][number]) => {
    if (av.dataType === "boolean") return av.valueBoolean ? "Có" : "Không";
    if (av.dataType === "number" && av.valueNumber != null) {
      const suffix = av.unit ? ` ${av.unit}` : "";
      const kwHint = av.code === CAPACITY_BTU_ATTRIBUTE_CODE && av.valueNumber > 0
        ? ` (≈ ${btuToKw(av.valueNumber)} kW)`
        : "";
      return `${av.valueNumber.toLocaleString("vi-VN")}${suffix}${kwHint}`;
    }
    const text = av.valueText || "";
    // Some legacy spec entries already have the unit baked into the text
    // itself (e.g. "285 x 770 x 223 mm"), others store it separately on
    // the definition only — append only when not already present, so
    // neither style ends up duplicated or missing.
    if (av.unit && text && !text.toLowerCase().includes(av.unit.toLowerCase())) {
      return `${text} ${av.unit}`;
    }
    return text;
  };
  // displayPrice (default-variant cache, see elc-go/docs/product-v2-design.md)
  // is the source of truth once a product has real variants — used here for
  // the floating CTA bar / recently-viewed snapshot, which (unlike
  // ProductVariantSwitcher below) don't track the customer's live selection.
  const finalPrice = resolveProductDisplayPrice(product);
  const defaultVariant = resolveDefaultVariant(product);
  const images = product.images || [];

  return (
    <main className={STYLES.main}>
      <TrackProductView
        id={product.id}
        name={product.name}
        slug={product.slug}
        image={primaryImageUrl(product.images) || null}
        salePrice={finalPrice}
        originalPrice={defaultVariant?.originalPrice ?? 0}
        stockStatus={toLegacyStockStatusForBadge(product.displayStockStatus) ?? null}
      />
      <TrackView entityType="product" entityId={product.id} entityName={product.name} />
      {/* ===== KHỐI 1: ẢNH + THÔNG TIN SẢN PHẨM ===== */}
      <GridSection
        id="product-detail-top"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="w-full animate-fade-in-up">
          <div className={STYLES.topSection}>
            <div className={STYLES.imageArea}>
              <div className={STYLES.carouselWrapper}>
                <Carousel className="w-full">
                  <CarouselContent>
                    {images.length > 0 ? (
                      images.map((img, i) => (
                        <CarouselItem key={i}>
                          <AspectRatio ratio={16 / 9}>
                            <Image
                              src={img.url}
                              alt={
                                img.alt ||
                                `${product.name} ${defaultVariant?.sku ? `(${defaultVariant.sku})` : ""} - ${product.brand?.name || "ELC"} - Điện máy ELC`
                              }
                              fill
                              className={STYLES.carouselImage}
                              loading={i === 0 ? "eager" : "lazy"}
                              fetchPriority={i === 0 ? "high" : "auto"}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                            />
                          </AspectRatio>
                        </CarouselItem>
                      ))
                    ) : (
                      <CarouselItem>
                        <AspectRatio ratio={4 / 3}>
                          <div className={STYLES.noImage}>Chưa có ảnh</div>
                        </AspectRatio>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                  {images.length > 1 && (
                    <>
                      <CarouselPrevious className="hidden lg:flex left-4 opacity-50 hover:opacity-100 transition-opacity" />
                      <CarouselNext className="hidden lg:flex right-4 opacity-50 hover:opacity-100 transition-opacity" />
                    </>
                  )}
                </Carousel>
              </div>
            </div>

            <div className={STYLES.infoArea}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {product.brand?.name && (
                  <Badge variant="secondary">{product.brand.name}</Badge>
                )}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground/70">
                  {category?.name && (
                    <TypographySmall className="text-muted-foreground">
                      {category.name}
                    </TypographySmall>
                  )}
                </div>
              </div>

              <TypographyH1 className={STYLES.productName}>{product.name}</TypographyH1>

              <ProductVariantSwitcher
                product={product}
                variants={product.variants || []}
                options={product.options || []}
                contacts={contacts || []}
              />
              <div id="product-cta-sentinel" aria-hidden="true" />
            </div>
          </div>
        </div>
      </GridSection>

      {/* ===== KHỐI 2: TABS THÔNG SỐ / MÔ TẢ ===== */}
      <GridSection
        id="product-detail-tabs"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="w-full">
          <Tabs defaultValue="specs" className="w-full">
            <TabsList className={STYLES.tabsListWrapper}>
              {attributeGroups.length > 0 && (
                <TabsTrigger value="specs">Thông số kỹ thuật</TabsTrigger>
              )}
              {product.description && (
                <TabsTrigger value="description">Mô tả sản phẩm</TabsTrigger>
              )}
            </TabsList>

            {attributeGroups.length > 0 && (
              <TabsContent value="specs" forceMount className={cn(STYLES.tabsContent, "data-[state=inactive]:hidden")}>
                <div className={STYLES.specsWrapper}>
                  {attributeGroups.map((group) => (
                    <dl key={group.label ?? "__chung__"} className={cn(STYLES.specsGrid, "mb-4 last:mb-0")}>
                      {group.label && (
                        <div className={STYLES.specHeader}>
                          <TypographyLarge className={STYLES.specHeaderLabel}>{group.label}</TypographyLarge>
                        </div>
                      )}
                      {group.rows.map((av) => (
                        <div key={av.id} className={STYLES.specRow}>
                          <dt className={STYLES.specLabel}>
                            <span className={STYLES.specLabelText}>{av.name}</span>
                          </dt>
                          <dd className={STYLES.specValue}>
                            <span className={STYLES.specValueMain}>{formatAttributeValue(av)}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ))}
                </div>
              </TabsContent>
            )}

            {product.description && (
              <TabsContent value="description" forceMount className={cn(STYLES.tabsContent, "data-[state=inactive]:hidden")}>
                <div className={STYLES.descriptionWrapper}>
                  <ProductDescription
                    content={product.description}
                    fallbackAlt={product.name}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </GridSection>

      {/* ===== KHỐI 4: SẢN PHẨM LIÊN QUAN ===== */}
      {relatedProducts.length > 0 && (
        <GridSection
          id="product-detail-related"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-6 md:py-8 lg:py-10"
        >
          <div className="w-full flex flex-col gap-6">
            <TypographyH1 className="text-xl md:text-2xl font-bold tracking-tight">
              Sản phẩm liên quan
            </TypographyH1>
            <div className={STYLES.relatedGrid}>
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </div>
        </GridSection>
      )}

      {/* ===== KHOI 5: FOOTER BAN QUYEN ===== */}
      <GridSection
        id="product-detail-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <footer className={STYLES.footer}>
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </GridSection>

      {/* ===== KHỐI 6: BREADCRUMBS ===== */}
      <GridSection
        id="product-detail-breadcrumbs"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <div className="w-full">
          <Breadcrumbs
            items={[
              { label: "Sản phẩm", href: "/san-pham" },
              {
                label: category.name,
                href: `/san-pham/${category.slug}`,
              },
              { label: product.name, active: true },
            ]}
          />
        </div>
      </GridSection>

      {/* ===== MOBILE FLOATING BAR ===== */}
      <ProductFloatingBar
        productName={product.name}
        salePrice={finalPrice || 0}
        originalPrice={defaultVariant?.originalPrice || 0}
        discountPercent={defaultVariant?.discountPercent || 0}
        productImage={primaryImageUrl(images) || null}
        productSlug={product.slug}
        contacts={contacts}
      />
    </main>
  );
}
