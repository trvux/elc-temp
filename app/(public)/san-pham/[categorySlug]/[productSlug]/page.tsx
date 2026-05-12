import { getCategories, type Category } from "@/modules/category";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
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
  TypographyH3,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { createClient } from "@/shared/lib/supabase/server";
import { createStaticClient } from "@/shared/lib/supabase/static";
import { cn, formatPrice } from "@/shared/lib/utils";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import { OrderButton } from "@/shared/components/layout/user/order-button";
import { ProductDescription } from "@/shared/components/layout/user/product-description";
import RelatedProducts from "@/shared/components/layout/user/related-products";
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

type Props = {
  params: Promise<{ categorySlug: string; productSlug: string }>;
};

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data: products } = await supabase
    .from("products")
    .select("slug, categories!inner(slug)")
    .eq("is_published", true);

  return (products ?? []).map((p) => {
    // Supabase join types can sometimes return an array even for 1-1 relations
    const category = Array.isArray(p.categories) ? p.categories[0] : p.categories;
    return {
      categorySlug: category?.slug || "unknown",
      productSlug: p.slug,
    };
  });
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { productSlug, categorySlug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("name, meta_title, meta_description, images, brands(name)")
    .eq("slug", productSlug)
    .eq("categories.slug", categorySlug)
    .single();

  if (!product) return {};

  const previousImages = (await parent).openGraph?.images || [];
  const title = product.meta_title || `${product.name} | Điện máy ELC`;
  const description = product.meta_description || `Thông tin chi tiết về ${product.name} tại Điện máy ELC.`;
  const images = product.images?.[0] ? [product.images[0], ...previousImages] : previousImages;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: 'article',
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    }
  };
}

const STYLES = {
  main: cn("min-h-screen w-full px-4 py-12 md:px-8"),
  container: cn("mx-auto w-full max-w-7xl flex flex-col gap-16"),
  topSection: cn("grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start"),
  imageArea: cn("space-y-4"),
  carouselWrapper: cn("w-full bg-white border border-border/50 rounded-2xl overflow-hidden shadow-sm"),
  carouselImage: cn("object-contain p-4"),
  noImage: cn("w-full h-full flex items-center justify-center text-muted-foreground text-xs tracking-widest"),
  infoArea: cn("flex flex-col gap-4 h-full justify-center"),
  productName: cn("w-full max-w-none text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight wrap-break-word leading-[1.15]"),
  subInfo: cn("flex flex-col gap-3"),
  priceArea: cn("space-y-2"),
  price: cn("text-3xl md:text-4xl font-bold text-foreground tracking-tight"),
  originalPriceWrapper: cn("flex items-center gap-2"),
  originalPrice: cn("text-md text-muted-foreground line-through"),
  discountBadge: cn("font-bold rounded-lg"),
  bottomSection: cn("mt-10"),
  tabsListWrapper: cn("mx-auto w-fit"),
  tabsContent: cn("pt-10 focus-visible:outline-none"),
  specsWrapper: cn("max-w-4xl mx-auto"),
  specsGrid: cn("rounded-xl border border-border/50 overflow-hidden divide-y divide-border/40 bg-white/50"),
  specHeader: cn(),
  specHeaderLabel: cn(),
  specRow: cn("grid grid-cols-[1fr_1.5fr] bg-background hover:bg-muted/20 transition-colors"),
  specLabel: cn("px-4 py-3.5 border-r border-border/40"),
  specLabelText: cn(),
  specValue: cn("px-4 py-3.5 flex flex-col gap-1"),
  specValueMain: cn(),
  specSubItem: cn(),
  specSubLabel: cn(),
  specUnit: cn("ml-1.5"),
  descriptionWrapper: cn("max-w-4xl mx-auto"),
  footer: cn("border-t pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground"),
  scrollToTop: cn("flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors"),
};

export default async function ProductDetail({ params }: Props) {
  const { categorySlug, productSlug } = await params;
  const supabase = await createClient();

  // Fetch the product and all categories to build hierarchy
  const [{ data: product }, allCategories, { data: contacts }] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories!inner(id, name, slug, parent_id), brands(name)")
      .eq("slug", productSlug)
      .eq("categories.slug", categorySlug)
      .single(),
    getCategories({ type: "PRODUCT" }),
    supabase.from("contacts").select("*").order("order_index"),
  ]);

  if (!product) notFound();

  const leafCat = product.categories;
  const parentCat = (leafCat as any)?.parent_id
    ? allCategories?.find((c) => c.id === (leafCat as any).parent_id)
    : null;

  const normalizedSpecs: SpecItem[] = Array.isArray(product.specs)
    ? (product.specs as unknown as SpecItem[])
    : Object.entries((product.specs as Record<string, string>) || {}).map(([label, value]) => ({
        label,
        value: String(value),
      }));

  const finalPrice = product.sale_price || product.original_price;
  const images = (product.images as string[]) || [];

  const isSectionHeader = (spec: SpecItem) =>
    spec.label === spec.label.toUpperCase() && spec.label.length > 3 && !spec.value && !spec.items;

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
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
                            alt={`${product.name} ${product.sku ? `(${product.sku})` : ""} - ${product.brands?.name || "ELC"} - Điện máy ELC`}
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
                    <CarouselPrevious className="left-4 opacity-50 hover:opacity-100 transition-opacity" />
                    <CarouselNext className="right-4 opacity-50 hover:opacity-100 transition-opacity" />
                  </>
                )}
              </Carousel>
            </div>
          </div>

          <div className={STYLES.infoArea}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {product.brands?.name && <Badge variant="secondary">{product.brands.name}</Badge>}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground/70">
                {parentCat?.name && <TypographySmall>{parentCat.name}</TypographySmall>}
                {parentCat?.name && leafCat?.name && <span className="text-muted-foreground/20">/</span>}
                {leafCat?.name && <TypographySmall className="font-semibold text-foreground">{leafCat.name}</TypographySmall>}
              </div>
            </div>

            <TypographyH1 className={STYLES.productName}>{product.name}</TypographyH1>

            <div className={STYLES.subInfo}>
              {product.sku && <TypographySmall>Mã sản phẩm (SKU): {product.sku}</TypographySmall>}
            </div>

            <div className={STYLES.priceArea}>
              <p className={STYLES.price}>{formatPrice(finalPrice || 0)}</p>
              {(product.discount_percent || 0) > 0 && (
                <div className={STYLES.originalPriceWrapper}>
                  <span className={STYLES.originalPrice}>{formatPrice(product.original_price || 0)}</span>
                  <Badge className={STYLES.discountBadge}>
                    -{product.discount_percent}
                    <Percent className="w-3 h-3" strokeWidth={3} />
                  </Badge>
                </div>
              )}
            </div>
            <OrderButton contacts={(contacts || []).map(c => ({
              ...c,
              orderIndex: c.order_index || 0
            }))} />
          </div>
        </div>

        <div className={STYLES.bottomSection}>
          <Tabs defaultValue="specs" className="w-full">
            <TabsList className={STYLES.tabsListWrapper}>
              {normalizedSpecs.length > 0 && <TabsTrigger value="specs">Thông số kỹ thuật</TabsTrigger>}
              {product.description && <TabsTrigger value="description">Mô tả sản phẩm</TabsTrigger>}
            </TabsList>

            {normalizedSpecs.length > 0 && (
              <TabsContent value="specs" className={STYLES.tabsContent}>
                <div className={STYLES.specsWrapper}>
                  <div className={STYLES.specsGrid}>
                    {normalizedSpecs
                      .filter((spec) => spec.label && (spec.value || (spec.items && spec.items.some((i) => i.value)) || isSectionHeader(spec)))
                      .map((spec, idx) => {
                        if (isSectionHeader(spec)) {
                          return (
                            <div key={idx} className={STYLES.specHeader}>
                              <TypographyH3 className={STYLES.specHeaderLabel}>{spec.label}</TypographyH3>
                            </div>
                          );
                        }
                        return (
                          <div key={idx} className={STYLES.specRow}>
                            <div className={STYLES.specLabel}>
                              <span className={STYLES.specLabelText}>{spec.label}</span>
                            </div>
                            <div className={STYLES.specValue}>
                              {spec.value && <span className={STYLES.specValueMain}>{spec.value}</span>}
                              {spec.items?.filter((i) => i.value).map((item, i) => (
                                <span key={i} className={STYLES.specSubItem}>
                                  {item.label && <span className={STYLES.specSubLabel}>{item.label}:</span>}
                                  {item.value}
                                  {item.unit && <span className={STYLES.specUnit}>{item.unit}</span>}
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

        <RelatedProducts categoryId={product.category_id} currentProductId={product.id} brandId={product.brand_id} />

        <footer className={STYLES.footer}>
          <TypographySmall>&copy; {new Date().getFullYear()} ELC Holdings. Đã đăng ký bản quyền.</TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
