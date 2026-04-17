"use client";

import {
  AnimateIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/animate-in";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import {
  TypographyH1,
  TypographyLarge,
  TypographyMuted,
  TypographyP,
} from "@/components/ui/typography"; // Điều chỉnh path cho đúng file mày lưu
import { getOptimizedImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  discount_percent?: number;
  description?: string;
  original_price: number;
  sale_price?: number | null;
  images: string[];
  categories?: {
    name: string;
    slug: string;
    parent?: { name: string; slug: string } | null;
  };
}

interface FeaturesSectionProps {
  products: Product[];
}

export function FeaturesSection({ products }: FeaturesSectionProps) {
  const isShowingProducts = !!(products && products.length > 0);
  const title = isShowingProducts ? "Sản phẩm nổi bật" : "Dịch vụ & Giải pháp";

  // --- STYLES ---
  const styles = {
    section: "max-w-7xl mx-auto px-4 md:px-6 py-12 lg:py-20",
    title: "mb-10 md:mb-14",
    productGrid: "grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 hidden md:grid",
    serviceGrid: "grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    productCard: "group h-full flex flex-col border-none shadow-none hover:shadow-md transition-all duration-300",
    navBtn: "opacity-0 invisible group-hover/carousel:opacity-100 group-hover/carousel:visible transition-all duration-300",
    defaultCard: "group p-6 flex flex-col hover:shadow-md transition-all duration-300 h-full border-border/50",
    priceOld: "line-through text-xs text-muted-foreground",
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const defaultFeatures = [
    {
      title: "Tư vấn Giải pháp Smarthome",
      description: "Thiết kế hệ thống nhà thông minh chuyên biệt.",
    },
    {
      title: "Thiết bị Điện tử Cao cấp",
      description: "Cung cấp các dòng TV, Loa và thiết bị gia dụng.",
    },
    {
      title: "Thi công & Lắp đặt Tận tâm",
      description: "Đảm bảo quy trình lắp đặt chuẩn xác, an toàn.",
    },
    {
      title: "Bảo hành & Hỗ trợ Kỹ thuật",
      description: "Hỗ trợ xử lý sự cố nhanh chóng trong vòng 24h.",
    },
  ];

  const ProductCard = ({ product }: { product: Product }) => {
    const productUrl = `/san-pham/${product.categories?.slug || ""}/${product.slug}`;

    return (
      <Card className={styles.productCard}>
        <div className="relative group/carousel">
          <Carousel className="w-full">
            <CarouselContent>
              {product.images.map((img, idx) => (
                <CarouselItem key={idx}>
                  <Link href={productUrl}>
                    <AspectRatio ratio={16 / 9}>
                      <Image
                        src={getOptimizedImage(img, 600)}
                        fill
                        className="object-contain p-4"
                        alt={product.name}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading="eager"
                      />
                    </AspectRatio>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className={cn("left-2", styles.navBtn)} />
              <CarouselNext className={cn("right-2", styles.navBtn)} />
            </div>
          </Carousel>
        </div>

        <Link href={productUrl} className="p-4 flex flex-col gap-2">
          <TypographyMuted>{product.sku}</TypographyMuted>
          <TypographyLarge className="line-clamp-2 min-h-14">{product.name}</TypographyLarge>

          <div className="flex flex-col gap-1 mt-auto">
            <TypographyLarge>
              {formatPrice(product.sale_price || product.original_price)}
            </TypographyLarge>

            {(product.discount_percent ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <span className={styles.priceOld}>
                  {formatPrice(product.original_price)}
                </span>
                <Badge variant="secondary" className="rounded-full">-{product.discount_percent}%</Badge>
              </div>
            )}
          </div>
        </Link>
      </Card>
    );
  };

  const DefaultCard = ({ feature, index }: { feature: any; index: number }) => (
    <Card className={styles.defaultCard}>
      <TypographyH1 className="font-newsreader opacity-30 mb-6">
        {String(index + 1).padStart(2, "0")}
      </TypographyH1>
      <Separator className="mb-6 opacity-50" />
      <TypographyLarge className="mb-3 group-hover:text-primary transition-colors uppercase tracking-wider">
        {feature.title}
      </TypographyLarge>
      <TypographyP className="line-clamp-4 flex-1 text-muted-foreground">
        {feature.description}
      </TypographyP>
    </Card>
  );

  return (
    <section className={styles.section}>
      <AnimateIn>
        <TypographyH1 className={styles.title}>{title}</TypographyH1>
      </AnimateIn>

      {isShowingProducts ? (
        <>
          <AnimateIn delay={0.2}>
            <Carousel className="md:hidden" opts={{ align: "center" }}>
              <CarouselContent className="-ml-4">
                {products.map((p) => (
                  <CarouselItem key={p.id} className="pl-4 basis-[85%]">
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
        <StaggerContainer className={styles.serviceGrid}>
          {defaultFeatures.map((f, i) => (
            <StaggerItem key={i}>
              <DefaultCard feature={f} index={i} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </section>
  );
}
