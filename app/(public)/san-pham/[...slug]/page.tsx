import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderButton } from "@/components/user/order-button";
import { getOptimizedImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/server";
import { Percent } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

import { ProductDescription } from "@/components/user/product-description";

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
    <main className="w-full pt-24 pb-24 px-4 md:px-6">
      <div className="mx-auto w-full max-w-7xl">
        {/* TOP: Carousel + Product Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Carousel */}
          <div className="space-y-4">
            <div className="w-full bg-white border border-border/50 rounded-2xl overflow-hidden shadow-sm">
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
                            className="object-contain p-6 md:p-10"
                            priority={i === 0}
                            sizes="(max-width: 1024px) 100vw, 50vw"
                          />
                        </AspectRatio>
                      </CarouselItem>
                    ))
                  ) : (
                    <CarouselItem>
                      <AspectRatio ratio={4 / 3}>
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs uppercase tracking-widest">
                          Chưa có ảnh
                        </div>
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
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="space-y-8">
              {/* Name */}
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight">
                  {product.name}
                </h1>
                {product.sku && (
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-[0.2em]">
                    SKU:{" "}
                    <span className="text-foreground/80">{product.sku}</span>
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <p className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(finalPrice)}
                </p>
                {product.discount_percent > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground line-through text-base">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product.original_price)}
                    </span>
                    <Badge
                      variant="outline"
                      className="gap-0.5 text-xs font-bold px-2 py-0.5 border-primary/20 bg-primary/5 text-primary"
                    >
                      -{product.discount_percent}
                      <Percent className="w-3 h-3" strokeWidth={3} />
                    </Badge>
                  </div>
                )}
              </div>

              <Separator className="opacity-50" />

              {/* Category + CTA */}
              <div className="space-y-4">
                {categoryDisplay && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      Danh mục:
                    </span>
                    <p className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                      {categoryDisplay}
                    </p>
                  </div>
                )}
                <OrderButton contacts={contacts || []} />
              </div>

              {/* Service links */}
              <div className="pt-2 flex flex-wrap gap-x-6 gap-y-3">
                {[
                  "Kiểm tra tình trạng hàng",
                  "Chính sách vận chuyển & Lắp đặt",
                ].map((item) => (
                  <button
                    key={item}
                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground underline underline-offset-4 uppercase tracking-[0.15em] transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: Tabs */}
        <div className="mt-20">
          <Tabs defaultValue="specs" className="w-full">
            <TabsList className="mx-auto w-fit">
              {normalizedSpecs.length > 0 && (
                <TabsTrigger value="specs">Thông số kỹ thuật</TabsTrigger>
              )}
              {product.description && (
                <TabsTrigger value="description">Mô tả sản phẩm</TabsTrigger>
              )}
            </TabsList>

            {normalizedSpecs.length > 0 && (
              <TabsContent
                value="specs"
                className="pt-10 focus-visible:outline-none"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/40 bg-white/50">
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
                            <div key={idx} className="bg-muted/40 px-4 py-3">
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60">
                                {spec.label}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className="grid grid-cols-[1fr_1.5fr] bg-transparent hover:bg-muted/20 transition-colors"
                          >
                            <div className="px-4 py-3.5 border-r border-border/40">
                              <span className="text-xs font-medium text-muted-foreground leading-snug">
                                {spec.label}
                              </span>
                            </div>
                            <div className="px-4 py-3.5 flex flex-col gap-1">
                              {spec.value && (
                                <span className="text-xs font-semibold text-foreground">
                                  {spec.value}
                                </span>
                              )}
                              {spec.items &&
                                spec.items
                                  .filter((i) => i.value)
                                  .map((item, i) => (
                                    <span
                                      key={i}
                                      className="text-xs font-semibold text-foreground leading-snug"
                                    >
                                      {item.label && (
                                        <span className="text-muted-foreground/70 font-medium mr-1.5">
                                          {item.label}:
                                        </span>
                                      )}
                                      {item.value}
                                      {item.unit && (
                                        <span className="text-muted-foreground/60 ml-1.5 uppercase text-[9px] tracking-wider">
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
              <TabsContent
                value="description"
                className="pt-10 focus-visible:outline-none"
              >
                <div className="max-w-4xl mx-auto prose prose-slate prose-sm md:prose-base dark:prose-invert">
                  <ProductDescription content={product.description} />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </main>
  );
}
