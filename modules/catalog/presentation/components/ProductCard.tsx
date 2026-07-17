import { ProductWithRelations, resolveProductDisplayPrice, resolveDefaultVariant, toLegacyStockStatusForBadge } from "@/modules/catalog/domain";
import { FormattedPrice } from "@/modules/catalog/presentation/components/FormattedPrice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { StockBadge } from "@/shared/components/ui/stock-badge";
import {
  TypographyLarge,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: ProductWithRelations;
  priority?: boolean;
}

export function ProductCard({
  product,
  priority = false,
}: ProductCardProps) {
  const productUrl = `/san-pham/${product.slug}`;

  const defaultVariant = resolveDefaultVariant(product);
  const hasDiscount = (defaultVariant?.discountPercent ?? 0) > 0;
  // displayPrice (write-time cache, reflects the product's default variant —
  // see elc-go/docs/product-v2-design.md) is always populated.
  const currentPrice = resolveProductDisplayPrice(product);
  const displaySku = defaultVariant?.sku ? defaultVariant.sku.split("/")[0].trim() : "";
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
          <div className="relative z-30 aspect-video w-full bg-white">
            <Image
              src={imageUrl}
              alt={product.images[0]?.alt || `${product.name} - Chính hãng giá tốt tại Điện máy ELC`}
              title={`${product.name} - Điện máy ELC`}
              fill
              sizes="(max-width: 640px) calc(50vw - 12px), (max-width: 1024px) calc(33vw - 16px), 25vw"
              className="object-contain"
              loading={priority ? "eager" : "lazy"}
              priority={priority}
            />
          </div>
        ) : (
          <div className="relative z-30 aspect-video w-full bg-white" />
        )}
        {/* px-3 md:px-6 */}
        <StockBadge
          className="w-full"
          status={toLegacyStockStatusForBadge(product.displayStockStatus)}
          // className="text-sm"
        />
        <CardHeader className="px-2">
          <CardTitle className="line-clamp-2 h-12">
            {product.name}
          </CardTitle>
          <CardDescription className="flex flex-col gap-1 text-xs">
            {displaySku && (
              <span>
                SKU: <span className="text-foreground">{displaySku}</span>
                <br />
              </span>
            )}
            {product.brand?.name && (
              <span>
                Thương hiệu:{" "}
                <span className="uppercase text-foreground">
                  {product.brand.name.toLowerCase()}
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
                <FormattedPrice price={defaultVariant?.originalPrice ?? 0} strikethrough />
              </TypographySmall>

              <TypographySmall className="text-destructive">
                -{defaultVariant?.discountPercent ?? 0}%
              </TypographySmall>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
