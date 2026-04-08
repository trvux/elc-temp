import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { Percent } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default async function ProductsHub() {
  const supabase = await createClient();

  // Fetch all published products
  const { data: allProducts } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("is_published", true)
    .order("order_index");

  const products = allProducts || [];

  return (
    <main className="w-full bg-background pt-24 pb-48 font-sans">
      {/* Centered Container with Fluid Padding */}
      <div className="mx-auto w-full px-container max-w-[1400px]">
        {/* Clean Header - Centered */}
        <header className="py-20 flex flex-col items-center text-center space-y-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Giải Pháp Thông Minh
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground tracking-widest capitalize font-medium">
            {products.length} Giải pháp chuyên nghiệp
          </p>
        </header>

        {/* Zara Editorial Grid - Much more spacious */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 md:gap-x-12 xl:gap-x-16 gap-y-24 md:gap-y-32 lg:gap-y-40">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/san-pham/${product.categories?.slug ? product.categories.slug + "/" : ""}${product.slug}`}
              className="group flex flex-col"
            >
              <div className="w-full overflow-hidden bg-muted/5">
                <AspectRatio ratio={4 / 3}>
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain p-4 transition-transform duration-1000 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-[10px] font-bold capitalize tracking-[0.3em]">
                      Ảnh SP
                    </div>
                  )}
                </AspectRatio>
              </div>

              {/* Info with fixed layout to ensure alignment */}
              <div className="mt-6 flex flex-col flex-1 px-0.5">
                {/* Fixed height for name to ensure alignment */}
                <div className="min-h-[3.5rem]">
                  <h3 className="text-base md:text-lg font-bold text-foreground leading-tight tracking-tight capitalize line-clamp-2">
                    {product.name}
                  </h3>
                </div>

                <div className="flex flex-col mt-1">
                  <span className="text-muted-foreground/60 font-bold tracking-[0.05em] text-[10px] capitalize">
                    SKU
                  </span>
                  <span className="text-foreground/80 font-bold tracking-[0.05em] text-[12px] capitalize">
                    {product.sku || "0000/000"}
                  </span>
                </div>

                <div className="mt-auto pt-4 flex flex-col gap-2 h-16 md:h-20">
                  {product.discount_percent > 0 ? (
                    <>
                      <span className="font-bold text-foreground tracking-tight text-xl md:text-2xl block leading-none">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.sale_price)}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground line-through text-sm md:text-md font-bold">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(product.original_price)}
                        </span>
                        {/* Discount Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-transparent flex-shrink-0 flex-grow-0 h-fit">
                          <span className="text-[11px] font-bold text-foreground tracking-tight">
                            -{product.discount_percent}
                          </span>
                          <Percent className="w-4 h-4" strokeWidth={2} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <span className="font-bold text-foreground tracking-tight text-xl md:text-2xl block leading-none">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product.original_price)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
