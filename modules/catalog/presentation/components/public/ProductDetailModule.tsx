import { getAdjacentProducts } from "@/modules/catalog/application/getAdjacentProducts";
import { formatPrice, ProductWithRelations } from "@/modules/catalog/domain";
import { productRepo } from "@/modules/catalog/infrastructure/SupabaseProductRepository";
import { getContactHref } from "@/modules/contact";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { DetailPager } from "@/shared/components/layout/user/detail-pager";
import { OrderButton } from "@/shared/components/layout/user/order-button";
import { ProductDescription } from "@/shared/components/layout/user/product-description";
import { ProductFloatingBar } from "@/shared/components/layout/user/product-floating-bar";
import RelatedProducts from "@/shared/components/layout/user/related-products";
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
import { StockBadge } from "@/shared/components/ui/stock-badge";
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
import { createClient, setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
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

  if (location) {
    return [
      {
        question: `${name} có được giao hàng và lắp đặt tận nơi tại ${locName} không?`,
        answer: `Có, Điện máy ELC cung cấp dịch vụ giao hàng và thi công lắp đặt trọn gói chuyên nghiệp tại ${locName} bởi đội ngũ kỹ thuật viên giàu kinh nghiệm, đảm bảo máy vận hành tốt nhất ngay từ ngày đầu sử dụng.`,
      },
      {
        question: `Chính sách bảo hành ${name} tại ${locName} như thế nào?`,
        answer: `Sản phẩm được bảo hành chính hãng theo đúng quy định của ${brand}. Điện máy ELC hỗ trợ tiếp nhận và xử lý bảo hành nhanh chóng tại ${locName} giúp khách hàng an tâm sau khi mua.`,
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
      answer: `Sản phẩm được bảo hành chính hãng theo quy định của ${brand}. Điện máy ELC hỗ trợ tiếp nhận và xử lý bảo hành nhanh chóng, đảm bảo quyền lợi tối đa cho khách hàng.`,
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
  setUseStaticClient(true);

  const supabase = await createClient();

  const { data: rawContacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("is_active", true)
    .order("order_index");

  const contacts = (rawContacts || []).map((row) => {
    const href = getContactHref(row.type || "", row.value || "");
    return {
      id: row.id,
      type: row.type || "",
      label: row.label || null,
      value: row.value || "",
      isActive: row.is_active ?? true,
      orderIndex: row.order_index || 0,
      href,
      isExternal: !href.startsWith("tel:") && !href.startsWith("mailto:"),
    };
  });

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
  const { prev, next } = await getAdjacentProducts(productRepo, product);

  const category = product.category;
  if (!category) notFound();

  const normalizedSpecs: SpecItem[] = Array.isArray(product.specs)
    ? (product.specs as unknown as SpecItem[])
    : Object.entries((product.specs as Record<string, string>) || {}).map(
        ([label, value]) => ({
          label,
          value: String(value),
        }),
      );

  const finalPrice = product.salePrice || product.originalPrice;
  const images = (product.images as string[]) || [];
  const mainSku = extractMainSku(product.sku);

  const isSectionHeader = (spec: SpecItem) =>
    spec.label === spec.label.toUpperCase() &&
    spec.label.length > 3 &&
    !spec.value &&
    !spec.items;

  const productWithRelations = product;
  const jsonLd = generateProductSchema(productWithRelations, location);
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
        image={(product.images as string[])?.[0] ?? null}
        salePrice={product.salePrice ?? 0}
        originalPrice={product.originalPrice ?? 0}
        stockStatus={product.stockStatus ?? null}
      />
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
                      images.map((img: string, i: number) => (
                        <CarouselItem key={i}>
                          <AspectRatio ratio={16 / 9}>
                            <ImageWithSkeleton
                              src={img}
                              alt={
                                location
                                  ? `${product.name} ${product.sku ? `(${product.sku})` : ""} tại ${location.name} - ${product.brand?.name || "ELC"} - Điện máy ELC`
                                  : `${product.name} ${product.sku ? `(${product.sku})` : ""} - ${product.brand?.name || "ELC"} - Điện máy ELC`
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

              <div className={STYLES.subInfo}>
                {product.sku && (
                  <TypographySmall>
                    Mã sản phẩm (SKU): {product.sku}
                  </TypographySmall>
                )}
                <StockBadge
                  status={product.stockStatus || undefined}
                  className="text-sm"
                />
              </div>

              <div className={STYLES.priceArea}>
                <TypographyLarge className={STYLES.price}>
                  {formatPrice(finalPrice || 0).replace(/\s?₫$/, "đ")}
                </TypographyLarge>
                {(product.discountPercent || 0) > 0 && (
                  <div className={STYLES.originalPriceWrapper}>
                    <TypographySmall className={STYLES.originalPrice}>
                      {formatPrice(product.originalPrice || 0).replace(/\s?₫$/, "đ")}
                    </TypographySmall>
                    <TypographySmall className="text-destructive">
                      - {product.discountPercent}%
                    </TypographySmall>
                  </div>
                )}
              </div>
              <OrderButton contacts={contacts || []} />
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
              {normalizedSpecs.length > 0 && (
                <TabsTrigger value="specs">Thông số kỹ thuật</TabsTrigger>
              )}
              {product.description && (
                <TabsTrigger value="description">Mô tả sản phẩm</TabsTrigger>
              )}
            </TabsList>

            {normalizedSpecs.length > 0 && (
              <TabsContent value="specs" forceMount className={cn(STYLES.tabsContent, "data-[state=inactive]:hidden")}>
                <div className={STYLES.specsWrapper}>
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
        originalPrice={product.originalPrice || 0}
        discountPercent={product.discountPercent || 0}
        productImage={images[0] ?? null}
        contacts={contacts}
      />
    </main>
  );
}
