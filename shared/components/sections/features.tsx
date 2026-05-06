"use client";

import {
  AnimateIn,
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/shared/components/ui/carousel";
import { Spinner } from "@/shared/components/ui/spinner";
import {
  TypographyH1,
  TypographyLarge,
  TypographyMuted,
  TypographyP,
} from "@/shared/components/ui/typography"; // Điều chỉnh path cho đúng file mày lưu
import { getOptimizedImage } from "@/shared/lib/image";
import { formatPrice } from "@/shared/lib/utils";
import Image from "next/image";
import Link from "next/link";

import { ProductWithRelations as Product } from "@/modules/catalog/domain";

interface FeaturesSectionProps {
  products: Product[];
}

export function FeaturesSection({ products }: FeaturesSectionProps) {
  const isShowingProducts = !!(products && products.length > 0);
  const title = "Sản phẩm nổi bật";

  // --- STYLES ---
  const styles = {
    section: "py-10 md:py-20",
    productGrid: "grid gap-6 md:grid-cols-3 lg:grid-cols-4 hidden md:grid",
    priceOld: "line-through text-muted-foreground",
    emptyState:
      "flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground border border-dashed rounded-xl bg-muted/30",
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const productUrl = `/san-pham/${product.category?.slug}/${product.slug}`;

    return (
      <Card className="h-full">
        <Link href={productUrl}>
          <AspectRatio ratio={16 / 9}>
            <Image
              src={getOptimizedImage(product.images[0], 600)}
              fill
              className="object-contain p-4"
              alt={product.name}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="eager"
            />
          </AspectRatio>
        </Link>

        <Link href={productUrl} className="p-4 pt-0 flex flex-col gap-2 flex-1">
          <div className="h-5 overflow-hidden">
            <TypographyMuted className="truncate">
              {product.sku}
            </TypographyMuted>
          </div>
          <TypographyLarge className="line-clamp-2 h-12 leading-snug">
            {product.name}
          </TypographyLarge>

          <div className="flex flex-col gap-1 mt-2">
            {/* Dòng 1: Giá hiện tại (Giá giảm hoặc Giá gốc) */}
            <TypographyLarge>
              {formatPrice(product.salePrice || product.originalPrice)}
            </TypographyLarge>

            {/* Dòng 2 & 3: Khu vực giá gốc và Badge - Cố định chiều cao để thẳng hàng */}
            <div className="flex flex-col gap-2 min-h-13 mt-1">
              {(product.discountPercent ?? 0) > 0 && (
                <>
                  <div className="flex items-center gap-2 h-5">
                    <span className={styles.priceOld}>
                      {formatPrice(product.originalPrice)}
                    </span>
                  </div>
                  <Badge
                    variant="destructive"
                    className="w-full rounded-sm justify-start px-2 py-0.5 font-medium"
                  >
                    Ưu đãi: {product.discountPercent}%
                  </Badge>
                </>
              )}
            </div>
          </div>
        </Link>
      </Card>
    );
  };

  return (
    <section className={styles.section}>
      <AnimateIn>
        <TypographyH1 className="mb-10 text-center">{title}</TypographyH1>
      </AnimateIn>

      {isShowingProducts ? (
        <>
          <AnimateIn delay={0.2} className="md:hidden">
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="ml-0 py-4">
                {products.map((p) => (
                  <CarouselItem
                    key={p.id}
                    className="pl-4 basis-[80%] sm:basis-[48%] flex"
                  >
                    <ProductCard product={p} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </AnimateIn>

          <StaggerContainer className={styles.productGrid}>
            {products.map((p) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </>
      ) : (
        <div className={styles.emptyState}>
          <Spinner className="size-8" />
          <TypographyP>Sản phẩm đang được cập nhật</TypographyP>
        </div>
      )}
    </section>
  );
}
