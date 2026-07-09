import { getAdjacentProductsAction } from "@/modules/catalog/presentation/actions";
import { ProductWithRelations, resolveProductDisplayPrice, resolveDefaultVariant, toLegacyStockStatusForBadge } from "@/modules/catalog/domain";
import { ProductLineCapacitySwitcher } from "@/modules/catalog/presentation/components/public/ProductLineCapacitySwitcher";
import { ProductVariantSwitcher } from "@/modules/catalog/presentation/components/public/ProductVariantSwitcher";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { TrackView } from "@/modules/event";
import { ReviewList, getReviewSummaryAction } from "@/modules/review";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { DetailPager } from "@/shared/components/layout/user/detail-pager";
import { ProductDescription } from "@/shared/components/layout/user/product-description";
import { ProductFloatingBar } from "@/shared/components/layout/user/product-floating-bar";
import RelatedProducts, { getCachedRelatedProducts } from "@/shared/components/layout/user/related-products";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { TrackProductView } from "@/shared/components/layout/user/track-product-view";
import { GridSection } from "@/shared/components/sections/grid-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/components/ui/carousel";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  TypographyH1,
  TypographyH2,
  TypographyLarge,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { District } from "@/shared/lib/districts";
import {
  BASE_URL,
  extractMainSku,
  generateBreadcrumbSchema,
  generateProductSchema,
  localizeRichText,
} from "@/shared/lib/seo-utils";
import { cn } from "@/shared/lib/utils";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

interface SpecSubItem {
  label: string;
  value: string;
  unit?: string;
}

interface SpecItem {
  label: string;
  value?: string;
  items?: SpecSubItem[];
}

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
};

function getFallbackProductFaq(
  product: ProductWithRelations,
  location?: District,
): Array<{ question: string; answer: string }> {
  const name = product.name;
  const brand = product.brand?.name || "hãng";
  const locName = location?.name || "TPHCM";
  // Prefer the real warranty period the admin entered (ProductWarrantyCard)
  // over generic copy — falls back to the old vague wording when unset.
  const warrantyLine = product.warrantyMonths
    ? `bảo hành chính hãng ${product.warrantyMonths} tháng`
    : "bảo hành chính hãng";

  if (location) {
    return [
      {
        question: `${name} có được giao hàng và lắp đặt tận nơi tại ${locName} không?`,
        answer: `Có, Điện máy ELC cung cấp dịch vụ giao hàng và thi công lắp đặt trọn gói chuyên nghiệp tại ${locName} bởi đội ngũ kỹ thuật viên giàu kinh nghiệm, đảm bảo máy vận hành tốt nhất ngay từ ngày đầu sử dụng.`,
      },
      {
        question: `Chính sách bảo hành ${name} tại ${locName} như thế nào?`,
        answer: `Sản phẩm được ${warrantyLine} theo đúng quy định của ${brand}. Điện máy ELC hỗ trợ tiếp nhận và xử lý bảo hành nhanh chóng tại ${locName} giúp khách hàng an tâm sau khi mua.`,
      },
      {
        question: `Mua ${name} tại ${locName} có được giá tốt nhất không?`,
        answer: `Điện máy ELC cam kết bán đúng giá niêm yết, không phụ thu. Quý khách tại ${locName} có thể liên hệ hotline để được tư vấn báo giá chi tiết và các chương trình khuyến mãi ưu đãi hàng tháng.`,
      },
    ];
  }

  return [
    {
      question: `${name} có chính hãng 100% không?`,
      answer: `Có, Điện máy ELC là đại lý phân phối chính thức của ${brand} tại Việt Nam, cam kết 100% sản phẩm chính hãng kèm đầy đủ chứng nhận xuất xứ và giấy tờ bảo hành.`,
    },
    {
      question: `${name} có bảo hành bao lâu?`,
      answer: `Sản phẩm được ${warrantyLine} theo quy định của ${brand}. Điện máy ELC hỗ trợ tiếp nhận và xử lý bảo hành nhanh chóng, đảm bảo quyền lợi tối đa cho khách hàng.`,
    },
    {
      question: `Điện máy ELC có dịch vụ lắp đặt ${name} không?`,
      answer: `Có, Điện máy ELC cung cấp dịch vụ lắp đặt trọn gói bởi đội ngũ kỹ thuận viên được đào tạo bài bản, đảm bảo vận hành ón định, an toàn từ ngày đầu sử dụng.`,
    },
  ];
}

async function getCachedProductDetailData(productSlug: string) {
  "use cache";
  cacheLife("days");
  cacheTag("products-list", `slug:${productSlug}`);

  const { data: rawContacts } = await getContactsAction();
  const contacts = (rawContacts || []).filter((c) => c.isActive);

  return {
    contacts,
    currentYear: new Date().getFullYear(),
  };
}

export async function ProductDetailModule({
  product,
  location,
}: {
  product: ProductWithRelations;
  location?: District;
}) {
  const { contacts, currentYear } = await getCachedProductDetailData(
    product.slug,
  );
  const { prev, next } = await getAdjacentProductsAction(product.id);

  const category = product.category;
  if (!category) notFound();

  // Structured attribute values (see modules/attribute-definition) — the
  // primary source of truth for specs now, replacing the free-text
  // products.specs jsonb the admin used to hand-type. 1 kW = 3412.14 BTU/h,
  // the same fixed physics conversion ProductSpecsTab.tsx computes for
  // admin display, shown here too for the capacity attribute.
  const BTU_PER_KW = 3412.14;
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
      const kwHint = av.code === "cong_suat_lam_lanh_btu" && av.valueNumber > 0
        ? ` (≈ ${(av.valueNumber / BTU_PER_KW).toFixed(2)} kW)`
        : "";
      return `${av.valueNumber.toLocaleString("vi-VN")}${suffix}${kwHint}`;
    }
    return av.valueText || "";
  };
  // Legacy free-text specs — anything the one-off migration script couldn't
  // confidently auto-map onto a structured attribute stays here, shown as a
  // fallback so nothing silently disappears. Entries whose label already
  // matches a populated attribute's name are hidden to avoid showing the
  // same fact twice (best-effort de-dup, not exhaustive — some genuine
  // synonyms may still show in both places).
  const shownAttributeNames = new Set(
    attributeGroups.flatMap((g) => g.rows.map((r) => r.name.trim().toLowerCase())),
  );
  const normalizedSpecs: SpecItem[] = (
    Array.isArray(product.specs)
      ? (product.specs as unknown as SpecItem[])
      : Object.entries((product.specs as Record<string, string>) || {}).map(
          ([label, value]) => ({
            label,
            value: String(value),
          }),
        )
  ).filter((spec) => !shownAttributeNames.has((spec.label || "").trim().toLowerCase()));

  // displayPrice (default-variant cache, see elc-go/docs/product-v2-design.md)
  // is the source of truth once a product has real variants — used here for
  // the floating CTA bar / recently-viewed snapshot, which (unlike
  // ProductVariantSwitcher below) don't track the customer's live selection.
  const finalPrice = resolveProductDisplayPrice(product);
  const defaultVariant = resolveDefaultVariant(product);
  const images = product.images || [];
  const mainSku = extractMainSku(defaultVariant?.sku);

  const isSectionHeader = (spec: SpecItem) =>
    spec.label === spec.label.toUpperCase() &&
    spec.label.length > 3 &&
    !spec.value &&
    !spec.items;

  const productWithRelations = product;
  const relatedProducts = await getCachedRelatedProducts(product.categoryId, product.id, product.brandId);
  const { data: reviewSummary } = await getReviewSummaryAction({ productId: product.id });
  const jsonLd = generateProductSchema(productWithRelations, location, relatedProducts, reviewSummary);
  const faqList = getFallbackProductFaq(product, location);

  const productUrl = location
    ? `${BASE_URL}/san-pham/${product.slug}/${location.slug}`
    : `${BASE_URL}/san-pham/${product.slug}`;
  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { label: "Sản phẩm", href: "/san-pham" },
      { label: category.name, href: `/san-pham/${category.slug}` },
      { label: product.name },
    ],
    productUrl,
  );

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqList.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqList.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            }),
          }}
        />
      )}
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
                            <ImageWithSkeleton
                              src={img.url}
                              alt={
                                img.alt ||
                                (location
                                  ? `${product.name} ${defaultVariant?.sku ? `(${defaultVariant.sku})` : ""} tại ${location.name} - ${product.brand?.name || "ELC"} - Điện máy ELC`
                                  : `${product.name} ${defaultVariant?.sku ? `(${defaultVariant.sku})` : ""} - ${product.brand?.name || "ELC"} - Điện máy ELC`)
                              }
                              fill
                              className={STYLES.carouselImage}
                              loading={i === 0 ? "eager" : "lazy"}
                              fetchPriority={i === 0 ? "high" : "auto"}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                              wrapperClassName="w-full h-full"
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

              <TypographyH1 className={STYLES.productName}>
                {product.name}
                {mainSku && !product.name.toLowerCase().includes(mainSku.toLowerCase())
                  ? ` - ${mainSku}`
                  : ""}
              </TypographyH1>

              <ProductLineCapacitySwitcher product={product} />

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
              {(attributeGroups.length > 0 || normalizedSpecs.length > 0) && (
                <TabsTrigger value="specs">Thông số kỹ thuật</TabsTrigger>
              )}
              {product.description && (
                <TabsTrigger value="description">Mô tả sản phẩm</TabsTrigger>
              )}
            </TabsList>

            {(attributeGroups.length > 0 || normalizedSpecs.length > 0) && (
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

                  {normalizedSpecs.length > 0 && (
                    <>
                      {attributeGroups.length > 0 && (
                        <TypographyLarge className="block mt-6 mb-2 text-muted-foreground">
                          Thông tin bổ sung
                        </TypographyLarge>
                      )}
                      <dl className={STYLES.specsGrid}>
                        {normalizedSpecs
                          .filter(
                            (spec) =>
                              spec.label &&
                              (spec.value ||
                                (spec.items && spec.items.some((i) => i.value)) ||
                                isSectionHeader(spec)),
                          )
                          .map((spec, idx) => {
                            if (isSectionHeader(spec)) {
                              return (
                                <div key={idx} className={STYLES.specHeader}>
                                  <TypographyLarge className={STYLES.specHeaderLabel}>
                                    {spec.label}
                                  </TypographyLarge>
                                </div>
                              );
                            }
                            return (
                              <div key={idx} className={STYLES.specRow}>
                                <dt className={STYLES.specLabel}>
                                  <span className={STYLES.specLabelText}>
                                    {spec.label}
                                  </span>
                                </dt>
                                <dd className={STYLES.specValue}>
                                  {spec.value && (
                                    <span className={STYLES.specValueMain}>
                                      {spec.value}
                                    </span>
                                  )}
                                  {spec.items
                                    ?.filter((i) => i.value)
                                    .map((item, i) => (
                                      <span key={i} className={STYLES.specSubItem}>
                                        {item.label && (
                                          <span className={STYLES.specSubLabel}>
                                            {item.label}:
                                          </span>
                                        )}
                                        {item.value}
                                        {item.unit && (
                                          <span className={STYLES.specUnit}>
                                            {item.unit}
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                </dd>
                              </div>
                            );
                          })}
                      </dl>
                    </>
                  )}
                </div>
              </TabsContent>
            )}

            {product.description && (
              <TabsContent value="description" forceMount className={cn(STYLES.tabsContent, "data-[state=inactive]:hidden")}>
                <div className={STYLES.descriptionWrapper}>
                  <ProductDescription
                    content={localizeRichText(product.description, location)}
                    fallbackAlt={product.name}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </GridSection>

      {/* ===== KHỐI 3: ĐIỀU HƯỚNG SẢN PHẨM TRƯỚC / SAU (cùng loại) ===== */}
      {(prev || next) && (
        <GridSection
          id="product-detail-pager"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-6 md:py-8 lg:py-10"
        >
          <DetailPager
            prevLabel="Sản phẩm trước"
            nextLabel="Sản phẩm tiếp theo"
            prev={
              prev ? { title: prev.name, href: `/san-pham/${prev.slug}` } : null
            }
            next={
              next ? { title: next.name, href: `/san-pham/${next.slug}` } : null
            }
          />
        </GridSection>
      )}

      {/* ===== KHỐI 4: SẢN PHẨM LIÊN QUAN ===== */}
      <GridSection
        id="product-detail-related"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="w-full">
          <RelatedProducts
            categoryId={product.categoryId}
            currentProductId={product.id}
            brandId={product.brandId}
            product={product}
          />
        </div>
      </GridSection>

      {/* ===== KHOI 4.5: FAQ ===== */}
      {faqList.length > 0 && (
        <GridSection
          id="product-detail-faq"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-10 border-t border-border/30"
        >
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight">
              Câu hỏi thường gặp (FAQ)
            </TypographyH2>
            <Accordion type="single" collapsible className="w-full">
              {faqList.map((item, index) => (
                <AccordionItem key={index} value={`faq-item-${index}`}>
                  <AccordionTrigger className="text-sm md:text-base font-semibold text-foreground py-4">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </GridSection>
      )}

      {/* ===== KHOI 4.6: DANH GIA KHACH HANG ===== */}
      <GridSection
        id="product-detail-reviews"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-10 border-t border-border/30"
      >
        <div className="w-full max-w-4xl mx-auto">
          <ReviewList productId={product.id} entityName={product.name} />
        </div>
      </GridSection>

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
