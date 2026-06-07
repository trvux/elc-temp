import {
  formatPrice,
  ProductWithRelations,
  STOCK_STATUS,
  STOCK_STATUS_MAP,
} from "@/modules/catalog/domain";
import { getAdjacentProducts } from "@/modules/catalog/application/getAdjacentProducts";
import { mapContactRowToDomain } from "@/modules/contact/domain";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { DetailPager } from "@/shared/components/layout/user/detail-pager";
import { OrderButton } from "@/shared/components/layout/user/order-button";
import { ProductDescription } from "@/shared/components/layout/user/product-description";
import RelatedProducts from "@/shared/components/layout/user/related-products";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
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
import { StockBadge } from "@/shared/components/ui/stock-badge";
import {
  TypographyH1,
  TypographyH3,
  TypographyH4,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { generateProductSchema } from "@/shared/lib/seo-utils";
import { createClient, setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
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

async function getCachedProductDetailData(productSlug: string) {
  "use cache";
  cacheLife({ stale: 0, revalidate: 300, expire: 86400 });
  cacheTag("products", `product:${productSlug}`);
  setUseStaticClient(true);

  const supabase = await createClient();

  const { data: rawContacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("is_active", true)
    .order("order_index");

  const contacts = (rawContacts || []).map(mapContactRowToDomain);

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
  const { contacts, currentYear } = await getCachedProductDetailData(product.slug);
  const { prev, next } = await getAdjacentProducts(product);

  const category = product.category;
  if (!category) notFound();

  const brand = product.brand;

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

  const isSectionHeader = (spec: SpecItem) =>
    spec.label === spec.label.toUpperCase() &&
    spec.label.length > 3 &&
    !spec.value &&
    !spec.items;

  const productWithRelations = product;
  const jsonLd = generateProductSchema(productWithRelations);

  return (
    <main className={STYLES.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
                            <Image
                              src={img}
                              alt={`${product.name} ${product.sku ? `(${product.sku})` : ""} - ${product.brand?.name || "ELC"} - Điện máy ELC`}
                              fill
                              className={STYLES.carouselImage}
                              priority={i === 0}
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

              <TypographyH1 className={STYLES.productName}>
                {product.name}
              </TypographyH1>

              <div className={STYLES.subInfo}>
                {product.sku && (
                  <TypographySmall>
                    Mã sản phẩm (SKU): {product.sku}
                  </TypographySmall>
                )}
                <StockBadge status={product.stockStatus || undefined} className="text-sm" />
              </div>

              <div className={STYLES.priceArea}>
                <TypographyH3 className={STYLES.price}>
                  {formatPrice(finalPrice || 0)}
                </TypographyH3>
                {(product.discountPercent || 0) > 0 && (
                  <div className={STYLES.originalPriceWrapper}>
                    <TypographyH4 className={STYLES.originalPrice}>
                      {formatPrice(product.originalPrice || 0)}
                    </TypographyH4>
                    <Badge variant="destructive">
                      Giảm giá: {product.discountPercent}%
                    </Badge>
                  </div>
                )}
              </div>
              <OrderButton contacts={contacts || []} />
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
              <TabsContent value="specs" className={STYLES.tabsContent}>
                <div className={STYLES.specsWrapper}>
                  <div className={STYLES.specsGrid}>
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
                              <TypographyH3 className={STYLES.specHeaderLabel}>
                                {spec.label}
                              </TypographyH3>
                            </div>
                          );
                        }
                        return (
                          <div key={idx} className={STYLES.specRow}>
                            <div className={STYLES.specLabel}>
                              <span className={STYLES.specLabelText}>
                                {spec.label}
                              </span>
                            </div>
                            <div className={STYLES.specValue}>
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
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </TabsContent>
            )}

            {product.description && (
              <TabsContent value="description" className={STYLES.tabsContent}>
                <div className={STYLES.descriptionWrapper}>
                  <ProductDescription content={product.description} />
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

      {/* ===== KHỐI 5: FOOTER BẢN QUYỀN ===== */}
      <GridSection
        id="product-detail-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {currentYear} ELC Holdings. Đã đăng ký bản quyền.
          </TypographySmall>
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
              {
                label: category.name,
                href: `/san-pham/${category.slug}`,
              },
              { label: product.name, active: true },
            ]}
          />
        </div>
      </GridSection>
    </main>
  );
}
