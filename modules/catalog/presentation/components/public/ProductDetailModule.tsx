import { ProductWithRelations, resolveProductDisplayPrice, resolveDefaultVariant, btuToKw, CAPACITY_BTU_ATTRIBUTE_CODE } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { ProductVariantSwitcher } from "@/modules/catalog/presentation/components/public/ProductVariantSwitcher";
import { getRelatedProducts } from "@/modules/catalog/presentation/getRelatedProducts";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { TrackView } from "@/modules/event";
import { getProductQuestionsAction } from "@/modules/question";
import { QuestionsPanel } from "@/modules/question/presentation/components/QuestionsPanel";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { ProductDescription } from "@/shared/components/layout/user/product-description";
import { ProductFloatingBar } from "@/shared/components/layout/user/product-floating-bar";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { TrackProductView } from "@/shared/components/layout/user/track-product-view";
import { WishlistButton } from "@/shared/components/layout/user/wishlist-button";
import { InView } from "@/shared/components/motion-primitives/in-view";
import { Spotlight } from "@/shared/components/motion-primitives/spotlight";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/components/ui/carousel";
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
import Image from "next/image";
import { notFound } from "next/navigation";

const GRID_CLASS =
  "grid gap-x-4 gap-y-6 md:gap-y-12 content-start grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

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
  const [relatedProducts, { data: questions }] = await Promise.all([
    getRelatedProducts(product),
    getProductQuestionsAction(product.id),
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
  const formatAttributeValue = (av: (typeof attributeGroups)[number]["rows"][number]) => {
    if (av.dataType === "boolean") return av.valueBoolean ? "Có" : "Không";
    if (av.dataType === "multiselect") return (av.valueOptions || []).join(", ");
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
  const compareItem = { id: product.id, name: product.name, slug: product.slug, categoryId: product.categoryId };

  const breadcrumbItems = [
    { label: "Sản phẩm", href: "/san-pham" },
    { label: category.name, href: `/san-pham/${category.slug}` },
    { label: product.name, active: true },
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
            <div className="relative w-full bg-white border border-border/50 rounded-2xl overflow-hidden shadow-sm">
              <Spotlight size={280} />
              <div className="absolute top-3 right-3 z-40">
                <WishlistButton productId={product.id} size="icon" />
              </div>
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
                            className="object-contain p-4"
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
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs tracking-widest">
                          Chưa có ảnh
                        </div>
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

            <div className="flex flex-col gap-4 h-full justify-center">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {product.brand?.name && (
                  <Badge variant="secondary">{product.brand.name}</Badge>
                )}
                {category?.name && (
                  <TypographySmall className="text-muted-foreground">{category.name}</TypographySmall>
                )}
              </div>

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
              <div id="product-cta-sentinel" aria-hidden="true" />
            </div>
          </div>
        </InView>
      </section>

      {/* ===== TABS: THÔNG SỐ / MÔ TẢ / HỎI ĐÁP ===== */}
      <section className="w-full max-w-350 mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 border-t border-dashed border-border/40">
        <Tabs defaultValue={attributeGroups.length > 0 ? "specs" : "description"} className="w-full">
          <TabsList className="mx-auto w-fit">
            {attributeGroups.length > 0 && <TabsTrigger value="specs">Thông số kỹ thuật</TabsTrigger>}
            {product.description ? <TabsTrigger value="description">Mô tả sản phẩm</TabsTrigger> : null}
            <TabsTrigger value="qa">Hỏi đáp</TabsTrigger>
          </TabsList>

          {attributeGroups.length > 0 && (
            <TabsContent value="specs" className="pt-10 focus-visible:outline-none">
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
            </TabsContent>
          )}

          {product.description && (
            <TabsContent value="description" className="pt-10 focus-visible:outline-none">
              <div className="max-w-4xl mx-auto">
                <ProductDescription content={product.description} fallbackAlt={product.name} />
              </div>
            </TabsContent>
          )}

          <TabsContent value="qa" className="pt-10 focus-visible:outline-none">
            <QuestionsPanel productId={product.id} questions={questions} />
          </TabsContent>
        </Tabs>
      </section>

      {/* ===== SẢN PHẨM LIÊN QUAN ===== */}
      {relatedProducts.length > 0 && (
        <section className="w-full max-w-350 mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 border-t border-dashed border-border/40">
          <div className="w-full flex flex-col gap-6">
            <TypographyH1 className="text-xl md:text-2xl font-bold tracking-tight">
              Sản phẩm liên quan
            </TypographyH1>
            <div className={GRID_CLASS}>
              {relatedProducts.map((related, i) => (
                <InView
                  key={related.id}
                  viewOptions={{ once: true, margin: "0px 0px -80px 0px" }}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.4, delay: Math.min(i, 5) * 0.05, ease: "easeOut" }}
                >
                  <ProductCard product={related} />
                </InView>
              ))}
            </div>
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
        const productSchema = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          image: images.map((img) => img.url),
          description: product.shortDescription || product.metaDescription || undefined,
          sku: defaultVariant?.sku || undefined,
          brand: product.brand?.name ? { "@type": "Brand", name: product.brand.name } : undefined,
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
              }
            : undefined,
        };

        const breadcrumbSchema = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { name: "Trang chủ", url: BASE_URL },
            { name: "Sản phẩm", url: `${BASE_URL}/san-pham` },
            { name: category.name, url: `${BASE_URL}/san-pham/${category.slug}` },
            { name: product.name, url: pageUrl },
          ].map((item, idx) => ({ "@type": "ListItem", position: idx + 1, name: item.name, item: item.url })),
        };

        const faqSchema = questions.length > 0
          ? {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: questions.map((q) => ({
                "@type": "Question",
                name: q.questionText,
                acceptedAnswer: { "@type": "Answer", text: q.answerText },
              })),
            }
          : null;

        return (
          <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            {faqSchema && (
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            )}
          </>
        );
      })()}
    </main>
  );
}
