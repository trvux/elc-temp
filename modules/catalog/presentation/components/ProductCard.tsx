import { HighlightedText } from "@/shared/components/layout/user/highlighted-text";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import {
  TypographyLarge,
  TypographyMuted,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { formatPrice } from "@/shared/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: any;
  categorySlug: string;
  brandSlug: string;
  queryTokens?: string[];
  priority?: boolean;
}

export function ProductCard({
  product,
  categorySlug,
  brandSlug,
  queryTokens = [],
  priority = false,
}: ProductCardProps) {
  const hasDiscount = product.discountPercent > 0;
  const currentPrice = product.salePrice || product.originalPrice || 0;

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg border-none shadow-none bg-background h-full">
      <Link
        href={`/san-pham/${categorySlug}/${brandSlug}/${product.slug}`}
        className="flex flex-col h-full"
      >
        <CardHeader className="p-0">
          <AspectRatio ratio={16 / 9} className="overflow-hidden">
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={`${product.name} - Chính hãng giá tốt tại Điện máy ELC`}
                title={`${product.name} - Điện máy ELC`}
                fill
                className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                loading={priority ? "eager" : "lazy"}
                {...(priority ? { fetchPriority: "high" } : {})}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <TypographyMuted>Chưa có ảnh</TypographyMuted>
              </div>
            )}
          </AspectRatio>
        </CardHeader>

        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-sm lg:text-base line-clamp-2 lg:line-clamp-3 min-h-10 lg:min-h-18 leading-snug group-hover:text-primary transition-colors text-balance">
              <HighlightedText text={product.name} queryTokens={queryTokens} />
            </h3>
            {product.sku && (
              <TypographyMuted className="uppercase">
                SKU:{" "}
                <HighlightedText
                  text={product.sku.split(/[ \/\+]/)[0].trim()}
                  queryTokens={queryTokens}
                />
              </TypographyMuted>
            )}
          </div>

          <div className="flex flex-col items-start gap-2">
            {hasDiscount ? (
              <>
                <TypographyLarge className="text-primary">
                  {formatPrice(currentPrice)}
                </TypographyLarge>
                <TypographySmall className="line-through text-muted-foreground">
                  {formatPrice(product.originalPrice || 0)}
                </TypographySmall>
                <Badge variant="destructive" className="gap-1 rounded-sm">
                  Giảm giá: {product.discountPercent}%
                </Badge>
              </>
            ) : (
              <TypographyLarge>
                {formatPrice(product.originalPrice || 0)}
              </TypographyLarge>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
