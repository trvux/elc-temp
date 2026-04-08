import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Percent } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { OrderButton } from "@/components/user/order-button";

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

  // Define interfaces for better typing
  interface CategoryData {
    name: string;
    slug: string;
    parent?: {
      name: string;
      slug: string;
    } | null;
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

  if (!rawProduct) {
    notFound();
  }

  const product = rawProduct;
  const leafCat = categoriesData?.find((c) => c.slug === leafCategorySlug);
  const parentCat = parentCategorySlug
    ? categoriesData?.find((c) => c.slug === parentCategorySlug)
    : null;

  const categoryDisplay = parentCat
    ? `${parentCat.name} / ${leafCat?.name || product.categories?.name}`
    : leafCat?.name || product.categories?.name;

  // Handle specifications normalization
  const normalizedSpecs: SpecItem[] = Array.isArray(product.specs)
    ? product.specs
    : Object.entries((product.specs as Record<string, string>) || {}).map(
        ([label, value]) => ({
          label,
          value: String(value),
        }),
      );

  const finalPrice = product.sale_price || product.original_price;

  return (
    <main className="w-full bg-background pt-30 pb-40 font-sans">
      <div className="mx-auto w-full px-container max-w-[1400px]">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 xl:gap-32">
          {/* LEFT: Product Images Area - Slimmer & Centered Look */}
          <div className="lg:w-[55%] space-y-8">
            <div className="w-full  overflow-hidden">
              <AspectRatio ratio={4 / 3}>
                {product.images?.[0] && (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-contain p-8"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                )}
              </AspectRatio>
            </div>

            {/* Grid for other images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-2 gap-4">
                {product.images.slice(1).map((img: string, i: number) => (
                  <div key={i}>
                    <AspectRatio ratio={4 / 3}>
                      <Image
                        src={img}
                        alt={`${product.name} ${i}`}
                        fill
                        className="object-contain p-4"
                        sizes="(max-width: 1024px) 50vw, 25vw"
                      />
                    </AspectRatio>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Information (Sticky & Slim) */}
          <div className="lg:w-[320px] xl:w-[380px] shrink-0 h-fit lg:sticky lg:top-36">
            <div className="space-y-6">
              {/* Name, SKU & Price Header */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h1 className="text-subtitle font-bold text-foreground leading-tight tracking-tight capitalize">
                    {product.name}
                  </h1>
                  <div className="flex flex-col pt-1">
                    <span className="text-[10px] text-muted-foreground font-bold capitalize tracking-[0.1em]">
                      SKU
                    </span>
                    <span className="text-[14px] text-foreground/80 font-bold capitalize tracking-[0.05em]">
                      {product.sku || "0000/000"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col pt-2">
                  {product.discount_percent > 0 && (
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground line-through text-base-fluid font-bold">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.original_price)}
                      </span>
                      {/* Discount Badge - Squared and Transparent */}
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-border bg-transparent">
                        <span className="text-[13px] font-bold text-foreground">
                          -{product.discount_percent}
                        </span>
                        <Percent className="w-4 h-4" strokeWidth={2} />
                      </div>
                    </div>
                  )}
                  <p className="text-4xl font-bold text-foreground tracking-tight leading-none">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(finalPrice)}
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-border mt-2" />

              {/* Action & Category info */}
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground font-bold capitalize tracking-tight leading-none">
                  {categoryDisplay}
                </div>

                <OrderButton contacts={contacts || []} />
              </div>

              {/* Technical Specifications */}
              {normalizedSpecs.length > 0 && (
                <div className="pt-8 space-y-5">
                  <h4 className="text-md font-bold text-foreground capitalize tracking-tight">
                    Thông số kỹ thuật
                  </h4>
                  <div className="space-y-4">
                    {normalizedSpecs
                      .filter(
                        (spec) =>
                          spec.label &&
                          (spec.value ||
                            (spec.items && spec.items.some((i) => i.value))),
                      )
                      .map((spec, idx) => (
                        <div
                          key={idx}
                          className="border-b border-border/40 pb-3 last:border-0"
                        >
                          <div className="grid grid-cols-[1.1fr_1.9fr] gap-4">
                            <span className="text-sm text-muted-foreground font-medium py-1">
                              {spec.label}
                            </span>
                            <div className="flex flex-col gap-1.5 py-1">
                              {spec.value && (
                                <span className="text-sm font-medium text-muted-foreground">
                                  {spec.value}
                                </span>
                              )}
                              {spec.items && spec.items.length > 0 && (
                                <div className="space-y-1.5">
                                  {spec.items
                                    .filter((item) => item.value)
                                    .map((item, i) => (
                                      <div
                                        key={i}
                                        className="text-sm font-medium text-muted-foreground leading-tight"
                                      >
                                        {item.label && (
                                          <span className="text-sm text-muted-foreground font-medium capitalize tracking-normal mr-1.5">
                                            {item.label}:
                                          </span>
                                        )}
                                        {item.value}
                                        {item.unit && (
                                          <span className="text-sm text-muted-foreground font-medium uppercase tracking-normal ml-1">
                                            {item.unit}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Description (Product Overview) */}
              <div className="pt-8 space-y-5 border-t border-zinc-50 mt-10">
                <h4 className="text-md font-bold text-foreground capitalize tracking-tight">
                  Tổng quan sản phẩm
                </h4>
                <div
                  className="prose prose-zinc max-w-none 
                    text-base-fluid leading-[1.65] text-muted-foreground font-medium tracking-wide
                    prose-p:mb-4 prose-img:w-full prose-img:h-auto prose-img:rounded-sm"
                  dangerouslySetInnerHTML={{
                    __html: product.description || "",
                  }}
                />
              </div>

              {/* Service Links */}
              <div className="pt-12 space-y-3">
                {[
                  "Kiểm tra tình trạng hàng",
                  "Chính sách vận chuyển & Lắp đặt",
                ].map((item) => (
                  <button
                    key={item}
                    className="block text-[10px] font-bold capitalize tracking-[0.15em] text-foreground hover:opacity-50 underline underline-offset-4"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
