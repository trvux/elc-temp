import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import {
  TypographyH2,
  TypographySmall,
} from "@/components/ui/typography";
import { createClient } from "@/lib/supabase/server";
import { cn, formatPrice } from "@/lib/utils";
import { Percent } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface RelatedProductsProps {
  categoryId: string;
  currentProductId: string;
  brandId?: string;
}

const STYLES = {
  section: cn("mt-20 border-t pt-16"),
  title: cn("mb-10"),
  grid: cn("grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16"),
  productCard: cn("group flex flex-col"),
  imageWrapper: cn("w-full overflow-hidden bg-background rounded-lg border border-border/40"),
  image: cn(
    "object-contain p-4 transition-transform duration-700 group-hover:scale-105",
  ),
  noImage: cn(
    "w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs tracking-widest",
  ),
  infoWrapper: cn("mt-4 flex flex-col gap-1.5"),
  productName: cn(
    "text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:underline underline-offset-4",
  ),
  sku: cn("text-xs text-muted-foreground tracking-wider"),
  priceWrapper: cn("mt-1 flex flex-col gap-0.5"),
  salePrice: cn("text-base md:text-lg font-bold tracking-tight"),
  originalPriceWrapper: cn("flex items-center gap-2"),
  originalPrice: cn("text-md text-muted-foreground line-through"),
  discountBadge: cn("font-bold rounded-lg"),
};

export default async function RelatedProducts({
  categoryId,
  currentProductId,
  brandId,
}: RelatedProductsProps) {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select(
      "*, categories!inner(name, slug, parent:parent_id(name, slug)), brands(name)",
    )
    .eq("category_id", categoryId)
    .neq("id", currentProductId)
    .order("brand_id", { ascending: brandId ? false : true })
    .limit(4);

  if (!products || products.length === 0) return null;

  return (
    <section className={STYLES.section}>
      <TypographyH2 className={STYLES.title}>Sản phẩm liên quan</TypographyH2>
      <div className={STYLES.grid}>
        {products.map((product: any) => {
          const finalPrice = product.sale_price || product.original_price;
          const slug = `/san-pham/${product.categories?.slug ? product.categories.slug : "detail"}/${product.slug}`;

          return (
            <Link key={product.id} href={slug} className={STYLES.productCard}>
              <div className={STYLES.imageWrapper}>
                <AspectRatio ratio={16 / 9}>
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className={STYLES.image}
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className={STYLES.noImage}>Chưa có ảnh</div>
                  )}
                </AspectRatio>
              </div>

              <div className={STYLES.infoWrapper}>
                <TypographyH2 className={STYLES.productName}>
                  {product.name}
                </TypographyH2>

                {product.sku && (
                  <span className={STYLES.sku}>
                    {product.sku}
                  </span>
                )}

                <div className={STYLES.priceWrapper}>
                  <span className={STYLES.salePrice}>
                    {formatPrice(finalPrice)}
                  </span>
                  
                  {product.discount_percent > 0 && (
                    <div className={STYLES.originalPriceWrapper}>
                      <span className={STYLES.originalPrice}>
                        {formatPrice(product.original_price)}
                      </span>
                      <Badge className={STYLES.discountBadge}>
                        -{product.discount_percent}
                        <Percent className="w-3 h-3" strokeWidth={3} />
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
