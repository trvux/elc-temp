import { formatPrice, ProductWithRelations } from "@/modules/catalog/domain";
import { HighlightedText } from "@/shared/components/layout/user/highlighted-text";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { StockBadge } from "@/shared/components/ui/stock-badge";
import {
  TypographyH4,
  TypographySmall,
} from "@/shared/components/ui/typography";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: ProductWithRelations;
  queryTokens?: string[];
  priority?: boolean;
}

export function ProductCard({
  product,
  queryTokens = [],
  priority = false,
}: ProductCardProps) {
  const productUrl = `/san-pham/${product.slug}`;

  const hasDiscount = product.discountPercent > 0;
  const currentPrice = product.salePrice || product.originalPrice || 0;
  const displaySku = product.sku ? product.sku.split("/")[0].trim() : "";

  return (
    <Link href={productUrl} className="w-full block group h-full">
      <Card className="relative mx-auto w-full h-full max-w-sm pt-0 transition-all duration-300 hover:shadow-md cursor-pointer gap-2 md:gap-3 overflow-hidden">
        <div className="absolute inset-0 z-30 aspect-video bg-white" />
        {product.images?.[0] ? (
          <div className="relative z-30 aspect-video w-full bg-white">
            <Image
              src={product.images[0]}
              alt={`${product.name} - Chính hãng giá tốt tại Điện máy ELC`}
              title={`${product.name} - Điện máy ELC`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain"
              loading={priority ? "eager" : "lazy"}
              priority={priority}
            />
          </div>
        ) : (
          <div className="relative z-30 aspect-video w-full bg-white" />
        )}
        {/* px-3 md:px-6 */}
        <CardHeader className="px-2">
          <CardTitle className="line-clamp-2 h-12">
            <HighlightedText text={product.name} queryTokens={queryTokens} />
          </CardTitle>
          <CardDescription className="flex flex-col gap-1 text-xs">
            {displaySku && (
              <span>
                SKU:{" "}
                <span className="text-foreground">
                  <HighlightedText
                    text={displaySku}
                    queryTokens={queryTokens}
                  />
                </span>
                <br />
              </span>
            )}
            {product.brand?.name && (
              <span>
                Thương hiệu:{" "}
                <span className="uppercase text-foreground">
                  <HighlightedText
                    text={product.brand.name.toLowerCase()}
                    queryTokens={queryTokens}
                  />
                </span>
              </span>
            )}
            <StockBadge
              status={product.stockStatus || undefined}
              // className="text-sm"
            />
          </CardDescription>
        </CardHeader>
        {/* px-3 md:px-6 */}
        <CardContent className="flex flex-col gap-2 px-2">
          <TypographyH4>{formatPrice(currentPrice)}</TypographyH4>
          {hasDiscount && (
            <>
              <TypographySmall className="line-through text-muted-foreground">
                {formatPrice(product.originalPrice)}
              </TypographySmall>
              <Badge variant="destructive" className="rounded-sm">
                Ưu đãi tới {product.discountPercent}%
              </Badge>
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
