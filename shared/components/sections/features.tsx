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
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface FeaturesSectionProps {
  products: Product[];
}

export function FeaturesSection({ products }: FeaturesSectionProps) {
  const isShowingProducts = !!(products && products.length > 0);
  const title = "Sản phẩm nổi bật";

  // --- STYLES ---
  const styles = {
    productGrid:
      "grid gap-6 md:grid-cols-3 lg:grid-cols-4 hidden md:grid w-full",
    emptyState:
      "flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground border border-dashed rounded-xl bg-muted/30 w-full",
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8">
      <StaggerContainer className="w-full" immediate>
        <div className="flex flex-col items-center text-center gap-3">
          <StaggerItem>
            <TypographyH1>
              <Link
                href="/san-pham"
                className="group relative inline-flex items-center justify-center  transition-colors"
              >
                {title}
                <ArrowUpRight className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-8 md:w-8 transition-all duration-300 group-hover:-translate-y-2 group-hover:translate-x-2" />
              </Link>
            </TypographyH1>
          </StaggerItem>
          <StaggerItem>
            <TypographyP className="text-muted-foreground max-w-2xl mx-auto">
              Khám phá hệ sinh thái thiết bị cao cấp tại ELC, bao gồm các hệ
              thống điều hòa không khí đa dạng, hệ thống cấp khí tươi thu hồi
              nhiệt và lọc không khí chuyên nghiệp cùng các giải pháp nhà thông
              minh (Smart home) toàn diện, được lựa chọn kỹ lưỡng cho không gian
              sống của bạn.
            </TypographyP>
          </StaggerItem>
        </div>
      </StaggerContainer>

      {isShowingProducts ? (
        <>
          {/* Mobile Carousel */}
          <div className="md:hidden w-full">
            <Carousel className="w-full">
              <CarouselContent className="-ml-2 p-2">
                {products.map((product, index) => (
                  <CarouselItem key={product.id} className="px-2 basis-[80%]">
                    <div className="text-foreground h-full">
                      <ProductCard product={product} priority={index === 0} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Desktop Grid */}
          <StaggerContainer className={styles.productGrid} immediate>
            {products.map((product, index) => (
              <StaggerItem key={product.id}>
                <div className="text-foreground h-full">
                  <ProductCard product={product} priority={index < 4} />
                </div>
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
    </div>
  );
}
