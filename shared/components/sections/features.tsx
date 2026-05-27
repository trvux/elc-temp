"use client";

import { ProductWithRelations as Product } from "@/modules/catalog/domain";
import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import {
  AnimateIn,
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import { Card } from "@/shared/components/ui/card";
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
    <Card className="w-full bg-card text-card-foreground py-16 px-4 md:px-8 flex flex-col items-center justify-center gap-8 shadow-sm border overflow-hidden">
      <StaggerContainer className="w-full">
        <div className="flex flex-col items-center text-center gap-3">
          <StaggerItem>
            <TypographyH1>
              <Link
                href="/san-pham"
                className="group relative inline-flex items-center justify-center hover:text-blue-400 transition-colors"
              >
                {title}
                <ArrowUpRight className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-8 md:w-8 transition-all duration-300 group-hover:-translate-y-2 group-hover:translate-x-2" />
              </Link>
            </TypographyH1>
          </StaggerItem>
          <StaggerItem>
            <TypographyP className="text-muted-foreground max-w-2xl mx-auto">
              Khám phá những giải pháp làm mát và lọc không khí tối ưu, được lựa
              chọn kỹ lưỡng cho không gian sống của bạn.
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
                    <ProductCard product={product} priority={index === 0} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Desktop Grid */}
          <StaggerContainer className={styles.productGrid}>
            {products.map((product, index) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} priority={index < 4} />
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
    </Card>
  );
}
