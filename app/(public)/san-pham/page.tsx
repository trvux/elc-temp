import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { Percent } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ProductPagination } from "@/components/user/product-pagination";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ProductsHub({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const pageSize = 12;

  const supabase = await createClient();

  // Fetch products with range for pagination
  const { data: allProducts, count } = await supabase
    .from("products")
    .select("*, categories(name, slug)", { count: "exact" })
    .eq("is_published", true)
    .order("order_index")
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

  const products = allProducts || [];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <main className="w-full pt-24 pb-24">
      <div className="mx-auto w-full px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <header className="py-16 flex flex-col items-center text-center gap-3">
          <h1 className="font-newsreader text-4xl md:text-5xl lg:text-6xl italic leading-tight">
            Giải pháp thông minh
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase font-medium">
            {totalCount} giải pháp chuyên nghiệp
          </p>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16">
          {products.map((product, index) => (
            <Link
              key={product.id}
              href={`/san-pham/${product.categories?.slug ? product.categories.slug + "/" : ""}${product.slug}`}
              className="group flex flex-col"
            >
              {/* Ảnh */}
              <div className="w-full overflow-hidden bg-background rounded-lg">
                <AspectRatio ratio={4 / 3}>
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain p-3 transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      priority={index === 0}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs tracking-widest uppercase">
                      Chưa có ảnh
                    </div>
                  )}
                </AspectRatio>
              </div>

              {/* Info */}
              <div className="mt-4 flex flex-col gap-1.5">
                <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:underline underline-offset-4">
                  {product.name}
                </h3>
                {product.sku && (
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    {product.sku}
                  </span>
                )}
                <div className="mt-1 flex flex-col gap-0.5">
                  <span className="text-base md:text-lg font-bold tracking-tight">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(product.sale_price || product.original_price)}
                  </span>
                  {product.discount_percent > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-md text-muted-foreground line-through">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.original_price)}
                      </span>
                      <span className="text-xs font-bold bg-foreground text-background px-1.5 py-0.5 rounded-sm">
                        -{product.discount_percent}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-16">
            <ProductPagination
              currentPage={currentPage}
              totalPages={totalPages}
            />
          </div>
        )}

        {!products.length && (
          <div className="py-24 text-center">
            <p className="text-muted-foreground/60 italic text-sm">
              Hiện chưa có sản phẩm nào.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
