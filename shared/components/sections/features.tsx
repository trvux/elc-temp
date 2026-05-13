"use client";

import { ProductWithRelations as Product } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import {
  AnimateIn,
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/shared/components/ui/carousel";
import { Spinner } from "@/shared/components/ui/spinner";
import {
  TypographyH1,
  TypographyMuted,
  TypographyP,
} from "@/shared/components/ui/typography";
import Link from "next/link";

interface FeaturesSectionProps {
  products: Product[];
}

export function FeaturesSection({ products }: FeaturesSectionProps) {
  const isShowingProducts = !!(products && products.length > 0);
  const title = "Sản phẩm nổi bật";

  // --- STYLES ---
  const styles = {
    productGrid: "grid gap-6 md:grid-cols-3 lg:grid-cols-4 hidden md:grid",
    emptyState:
      "flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground border border-dashed rounded-xl bg-muted/30",
  };

  return (
    <section className="space-y-8">
      <StaggerContainer>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <StaggerItem>
              <TypographyH1>{title}</TypographyH1>
            </StaggerItem>
            <StaggerItem>
              <TypographyP className="text-muted-foreground max-w-2xl">
                Khám phá những giải pháp làm mát và lọc không khí tối ưu, được lựa
                chọn kỹ lưỡng cho không gian sống của bạn.
              </TypographyP>
            </StaggerItem>
          </div>
          <StaggerItem>
            <Link
              href="/san-pham"
              className="text-primary hover:underline font-medium text-sm transition-all"
            >
              Xem tất cả sản phẩm &rarr;
            </Link>
          </StaggerItem>
        </div>
      </StaggerContainer>

      {isShowingProducts ? (
        <>
          {/* Mobile Carousel */}
          <div className="md:hidden">
            <Carousel className="w-full">
              <CarouselContent className="-ml-8 p-1">
                {products.map((product) => (
                  <CarouselItem key={product.id} className="pl-8 basis-[70%]">
                    <ProductCard
                      product={product}
                      categorySlug={product.category?.slug || "all"}
                      brandSlug={product.brand?.slug || "all"}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Desktop Grid */}
          <StaggerContainer className={styles.productGrid}>
            {products.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard
                  product={product}
                  categorySlug={product.category?.slug || "all"}
                  brandSlug={product.brand?.slug || "all"}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </>
      ) : (
        <AnimateIn className={styles.emptyState}>
          <Spinner />
          <TypographyMuted>Đang tải sản phẩm nổi bật...</TypographyMuted>
        </AnimateIn>
      )}
    </section>
  );
}
