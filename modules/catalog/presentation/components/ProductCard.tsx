import { ProductWithRelations, formatPrice } from "@/modules/catalog/domain";
import { HighlightedText } from "@/shared/components/layout/user/highlighted-text";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  TypographyH3,
  TypographySmall,
} from "@/shared/components/ui/typography";
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
    <Link href={productUrl} className="block group h-full">
      <Card className="relative mx-auto w-full h-full max-w-sm pt-0 transition-all duration-300 hover:shadow-md cursor-pointer gap-3 md:gap-6">
        <div className="absolute inset-0 z-30 aspect-video bg-white" />
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={`${product.name} - Chính hãng giá tốt tại Điện máy ELC`}
            title={`${product.name} - Điện máy ELC`}
            className="relative z-30 aspect-video w-full object-contain"
          />
        ) : (
          <div className="relative z-30 aspect-video w-full object-contain bg-white" />
        )}

        <CardHeader className="px-3 md:px-6">
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
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-3 md:px-6">
          <TypographyH3>{formatPrice(currentPrice)}</TypographyH3>
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
