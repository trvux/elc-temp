import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TypographyH1, TypographySmall } from "@/components/ui/typography";
import { ScrollToTop } from "@/components/user/scroll-to-top";
import { getOptimizedImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { notFound } from "next/navigation";

import { OrderButton } from "@/components/user/order-button";
import { ProductDescription } from "@/components/user/product-description";
import { Percent } from "lucide-react";

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
  main: cn("min-h-screen w-full px-4 py-12 md:px-8"),
  container: cn("mx-auto w-full max-w-7xl flex flex-col gap-16"),
  topSection: cn(
    "grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start",
  ),
  imageArea: cn("space-y-4"),
  carouselWrapper: cn(
    "w-full bg-white border border-border/50 rounded-2xl overflow-hidden shadow-sm",
  ),
  carouselImage: cn("object-contain p-6 md:p-10"),
  noImage: cn(
    "w-full h-full flex items-center justify-center text-muted-foreground text-xs tracking-widest",
  ),
  // infoArea: cn("lg:sticky lg:top-24 flex flex-col gap-4"),
  infoArea: cn(" flex flex-col gap-4 h-full justify-center"),
  productName: cn("w-full max-w-none text-wrap"),
  subInfo: cn("flex flex-col gap-4"),
  priceArea: cn("space-y-2"),
  price: cn("text-3xl md:text-4xl font-bold text-foreground tracking-tight"),
  originalPriceWrapper: cn("flex items-center gap-2"),
  originalPrice: cn("text-md text-muted-foreground line-through"),

  discountBadge: cn("font-bold rounded-lg"),

  bottomSection: cn("mt-10"),
  tabsListWrapper: cn("mx-auto w-fit"),
  tabsContent: cn("pt-10 focus-visible:outline-none"),
  specsWrapper: cn("max-w-4xl mx-auto"),
  specsGrid: cn(
    "rounded-xl border border-border/50 overflow-hidden divide-y divide-border/40 bg-white/50",
  ),
  // specHeader: cn("bg-muted/40 px-4 py-3"),
  specHeader: cn(),
  // specHeaderLabel: cn(
  //   "text-[10px] font-bold  tracking-[0.2em] text-foreground/60",
  // ),
  specHeaderLabel: cn(),
  specRow: cn(
    "grid grid-cols-[1fr_1.5fr] bg-transparent hover:bg-muted/20 transition-colors",
  ),
  specLabel: cn("px-4 py-3.5 border-r border-border/40"),
  // specLabelText: cn("text-xs font-medium text-muted-foreground leading-snug"),
  specLabelText: cn(),
  specValue: cn("px-4 py-3.5 flex flex-col gap-1"),
  // specValueMain: cn("text-xs font-semibold text-foreground"),
  specValueMain: cn(),
  // specSubItem: cn("text-xs font-semibold text-foreground leading-snug"),
  specSubItem: cn(),
  // specSubLabel: cn("text-muted-foreground/70 font-medium mr-1.5"),
  specSubLabel: cn(),
  // specUnit: cn("text-muted-foreground/60 ml-1.5 tracking-wider"),
  specUnit: cn("ml-1.5"),
  descriptionWrapper: cn("max-w-4xl mx-auto"),
  footer: cn(
    "border-t pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const leafSlug = slug[slug.length - 1];
  const categoryPath = slug.slice(0, -1).join("/");

  const supabase = await createClient();

  interface CategoryData {
    name: string;
    slug: string;
    parent?: { name: string; slug: string } | null;
  }

  interface ProductData {
    id: string;
    name: string;
    sku?: string;
    original_price: number;
    sale_price?: number;
    images?: string[];
    specs?: SpecItem[] | Record<string, string>;
    discount_percent: number;
    description?: string;
    categories?: CategoryData;
  }

  const categorySlugs = categoryPath.split("/");
  const leafCategorySlug = categoryPath;
  const parentCategorySlug = categorySlugs.length > 1 ? categorySlugs[0] : null;

  const [{ data: rawProduct }, { data: categoriesData }, { data: contacts }] =
    (await Promise.all([
      supabase
        .from("products")
        .select("*, categories!inner(name, slug)")
        .eq("slug", leafSlug)
        .eq("categories.slug", categoryPath)
        .single(),
      supabase
        .from("categories")
        .select("name, slug")
        .in(
          "slug",
          [leafCategorySlug, parentCategorySlug].filter(Boolean) as string[],
        ),
      supabase.from("contacts").select("*").order("order_index"),
    ])) as [
      { data: ProductData | null },
      { data: { name: string; slug: string }[] | null },
      { data: any[] | null },
    ];

  if (!rawProduct) notFound();

  const product = rawProduct;
  const leafCat = categoriesData?.find((c) => c.slug === leafCategorySlug);
  const parentCat = parentCategorySlug
    ? categoriesData?.find((c) => c.slug === parentCategorySlug)
    : null;

  const categoryDisplay = parentCat
    ? `${parentCat.name} / ${leafCat?.name || product.categories?.name}`
    : leafCat?.name || product.categories?.name;

  const normalizedSpecs: SpecItem[] = Array.isArray(product.specs)
    ? product.specs
    : Object.entries((product.specs as Record<string, string>) || {}).map(
        ([label, value]) => ({ label, value: String(value) }),
      );

  const finalPrice = product.sale_price || product.original_price;
  const images = product.images || [];

  // Group specs by section headers (specs with no value but have items, or ALL-CAPS labels)
  const isSectionHeader = (spec: SpecItem) =>
    spec.label === spec.label.toUpperCase() &&
    spec.label.length > 3 &&
    !spec.value &&
    !spec.items;

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        {/* TOP: Carousel + Product Info */}
        <div className={STYLES.topSection}>
          {/* Carousel */}
          <div className={STYLES.imageArea}>
            <div className={STYLES.carouselWrapper}>
              <Carousel className="w-full">
                <CarouselContent>
                  {images.length > 0 ? (
                    images.map((img: string, i: number) => (
                      <CarouselItem key={i}>
                        <AspectRatio ratio={4 / 3}>
                          <Image
                            src={getOptimizedImage(img, 1000)}
                            alt={`${product.name} - ${i + 1}`}
                            fill
                            className={STYLES.carouselImage}
                            priority={i === 0}
                            sizes="(max-width: 1024px) 100vw, 50vw"
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
                    <CarouselPrevious className="left-4 opacity-50 hover:opacity-100 transition-opacity" />
                    <CarouselNext className="right-4 opacity-50 hover:opacity-100 transition-opacity" />
                  </>
                )}
              </Carousel>
            </div>
          </div>

          {/* Product Info */}
          <div className={STYLES.infoArea}>
            {/* Name */}
            <div>
              <TypographyH1 className={STYLES.productName}>
                {product.name}
              </TypographyH1>
            </div>
            <div className={STYLES.subInfo}>
              {categoryDisplay && <span>Danh mục: {categoryDisplay}</span>}
              {product.sku && <span>Sku: {product.sku}</span>}
            </div>
            {/* Price */}
            <div className={STYLES.priceArea}>
              <p className={STYLES.price}>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(finalPrice)}
              </p>
              {product.discount_percent > 0 && (
                <div className={STYLES.originalPriceWrapper}>
                  <span className={STYLES.originalPrice}>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(product.original_price)}
                  </span>
                  <Badge className={STYLES.discountBadge}>
                    -{product.discount_percent}
                    <Percent className="w-3 h-3" strokeWidth={3} />
                  </Badge>
                </div>
              )}
            </div>
            <OrderButton contacts={contacts || []} />
          </div>
        </div>

        {/* BOTTOM: Tabs */}
        <div className={STYLES.bottomSection}>
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
                              <span className={STYLES.specHeaderLabel}>
                                {spec.label}
                              </span>
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
                              {spec.items &&
                                spec.items
                                  .filter((i) => i.value)
                                  .map((item, i) => (
                                    <span
                                      key={i}
                                      className={STYLES.specSubItem}
                                    >
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

        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {new Date().getFullYear()} ELC Holdings. Đã đăng ký bản
            quyền.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
