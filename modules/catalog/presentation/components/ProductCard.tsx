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
import { WishlistButton } from "@/shared/components/layout/user/wishlist-button";
import { CompareToggleButton } from "@/shared/components/layout/user/compare-toggle-button";
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
    <Card className="relative mx-auto w-full h-full max-w-sm pt-0 transition-all duration-300 hover:shadow-md gap-2 md:gap-3 overflow-hidden">
      {/* Wishlist/compare live in their own footer row below, as a
          sibling of this Link rather than nested inside it — nesting real
          interactive elements (button/checkbox) inside an <a> is invalid
          HTML and browsers handle it inconsistently (a tap on the nested
          control could still trigger the outer link's navigation). */}
      <Link href={productUrl} className="block cursor-pointer" prefetch={false}>
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
        <StockBadge
          className="w-full"
          status={toLegacyStockStatusForBadge(product.displayStockStatus)}
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
      </Link>

      <div className="flex items-center gap-2 px-2 pb-2">
        <WishlistButton productId={product.id} variant="button" />
        <CompareToggleButton
          variant="icon"
          item={{ id: product.id, name: product.name, slug: product.slug, categoryId: product.categoryId }}
        />
      </div>
    </Card>
  );
}
