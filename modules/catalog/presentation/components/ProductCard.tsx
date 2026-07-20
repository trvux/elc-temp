import {
  ProductWithRelations,
  resolveProductDisplayPrice,
  resolveDefaultVariant,
  resolveDeliveryLabel,
  toLegacyStockStatusForBadge,
} from "@/modules/catalog/domain";
import { FormattedPrice } from "@/modules/catalog/presentation/components/FormattedPrice";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { StockBadge } from "@/shared/components/ui/stock-badge";
import {
  TypographyLarge,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import { BuyNowButton } from "@/shared/components/layout/user/buy-now-button";
import { WishlistButton } from "@/shared/components/layout/user/wishlist-button";
import { CompareToggleButton } from "@/shared/components/layout/user/compare-toggle-button";
import { Truck } from "@phosphor-icons/react/dist/ssr";
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
  const imageUrl = primaryImageUrl(product.images);
  const primaryTag = product.tags?.[0];

  const deliveryLabel = resolveDeliveryLabel(defaultVariant);

  return (
    <Card className="relative mx-auto w-full h-full max-w-sm pt-0 gap-0 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Wishlist/compare live in their own footer row below, as a
          sibling of this Link rather than nested inside it — nesting real
          interactive elements (button/checkbox) inside an <a> is invalid
          HTML and browsers handle it inconsistently (a tap on the nested
          control could still trigger the outer link's navigation). Link is
          flex-1 with a spacer at its end (below) so CardFooter always lands
          on the card's bottom edge, regardless of how many lines of
          content — short description, discount row — a given card has. */}
      <Link href={productUrl} className="group flex flex-1 flex-col cursor-pointer" prefetch={false}>
        <div className="relative z-30 aspect-square w-full bg-white overflow-hidden">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={product.images[0]?.alt || `${product.name} - Chính hãng giá tốt tại Điện máy ELC`}
              title={`${product.name} - Điện máy ELC`}
              fill
              sizes="(max-width: 640px) calc(50vw - 12px), (max-width: 1024px) calc(33vw - 16px), 25vw"
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
              loading={priority ? "eager" : "lazy"}
              priority={priority}
            />
          )}

          {/* Discount now rides next to the strikethrough price instead of
              overlaying the image — the tag (if any) is still the loudest
              overlay signal here. Stock status moves to the opposite corner
              instead of its own full-width bar below the image — "còn hàng"
              is the expected default on most cards, it doesn't need a whole
              row to itself. */}
          <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
            {primaryTag && <Badge variant="secondary">{primaryTag.name}</Badge>}
          </div>
          <div className="absolute top-2 right-2 z-10">
            <StockBadge status={toLegacyStockStatusForBadge(product.displayStockStatus)} />
          </div>
        </div>

        <CardHeader className="gap-1 px-3 pt-3">
          {product.brand?.name && (
            <TypographySmall className="text-muted-foreground uppercase tracking-wide">
              {product.brand.name.toLowerCase()}
            </TypographySmall>
          )}
          <CardTitle className="line-clamp-2 h-10 text-sm leading-snug font-semibold">
            {product.name}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-1.5 px-3 pt-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <TypographyLarge className="text-lg text-foreground">
              <FormattedPrice price={currentPrice} />
            </TypographyLarge>
            {hasDiscount && (
              <>
                <TypographySmall className="text-muted-foreground">
                  <FormattedPrice price={defaultVariant?.originalPrice ?? 0} strikethrough />
                </TypographySmall>
                <TypographySmall className="text-destructive font-medium">
                  -{defaultVariant?.discountPercent}%
                </TypographySmall>
              </>
            )}
          </div>

          {deliveryLabel && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Truck className="size-3.5 shrink-0" />
              <TypographySmall className="text-muted-foreground">{deliveryLabel}</TypographySmall>
            </div>
          )}
        </CardContent>

        <div className="flex-1" />
      </Link>

      <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-3 py-3">
        <div className="flex items-center gap-2 sm:contents">
          <WishlistButton productId={product.id} variant="button" className="flex-1 sm:hidden" />
          <WishlistButton productId={product.id} variant="icon" className="hidden sm:inline-flex sm:order-2" />
          <CompareToggleButton
            variant="icon"
            className="rounded-md sm:order-3 sm:rounded-full"
            item={{ id: product.id, name: product.name, slug: product.slug, categoryId: product.categoryId }}
          />
        </div>
        <BuyNowButton
          productName={product.name}
          productSlug={product.slug}
          salePrice={currentPrice}
          className="w-full sm:flex-1 sm:order-1"
        />
      </CardFooter>
    </Card>
  );
}
