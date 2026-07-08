import { ProductWithRelations } from "@/modules/catalog/domain";
import { FormattedPrice } from "@/modules/catalog/presentation/components/FormattedPrice";
import { HighlightedText } from "@/shared/components/layout/user/highlighted-text";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import { StockBadge } from "@/shared/components/ui/stock-badge";
import {
  TypographyLarge,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { primaryImageUrl } from "@/shared/lib/image-asset";
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
  const imageUrl = primaryImageUrl(product.images);

  return (
    <Link
      href={productUrl}
      className="w-full block group h-full"
      prefetch={false}
    >
      <Card className="relative mx-auto w-full h-full max-w-sm pt-0 transition-all duration-300 hover:shadow-md cursor-pointer gap-2 md:gap-3 overflow-hidden">
        <div className="absolute inset-0 z-30 aspect-video bg-white" />
        {imageUrl ? (
          <ImageWithSkeleton
            wrapperClassName="relative z-30 aspect-video w-full bg-white"
            src={imageUrl}
            alt={product.images[0]?.alt || `${product.name} - Chính hãng giá tốt tại Điện máy ELC`}
            title={`${product.name} - Điện máy ELC`}
            fill
            sizes="(max-width: 640px) calc(50vw - 12px), (max-width: 1024px) calc(33vw - 16px), 25vw"
            className="object-contain"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
          />
        ) : (
          <div className="relative z-30 aspect-video w-full bg-white" />
        )}
        {/* px-3 md:px-6 */}
        <StockBadge
          className="w-full"
          status={product.stockStatus || undefined}
          // className="text-sm"
        />
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
          </CardDescription>
        </CardHeader>
        {/* px-3 md:px-6 */}
        <CardContent className="flex flex-col gap-2 px-2">
          <TypographyLarge className="text-foreground">
            <FormattedPrice price={currentPrice} />
          </TypographyLarge>
          {hasDiscount && (
            <div className="flex items-center gap-2">
              <TypographySmall className="text-muted-foreground">
                <FormattedPrice price={product.originalPrice} strikethrough />
              </TypographySmall>

              <TypographySmall className="text-destructive">
                -{product.discountPercent}%
              </TypographySmall>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
