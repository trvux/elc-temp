"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  const isShowingProducts = products && products.length > 0;

  const defaultFeatures = [
    {
      title: "Tư vấn Giải pháp Smarthome",
      description:
        "Thiết kế hệ thống nhà thông minh chuyên biệt, tối ưu hoá trải nghiệm sống hiện đại.",
    },
    {
      title: "Thiết bị Điện tử Cao cấp",
      description:
        "Cung cấp các dòng TV, Loa và thiết bị gia dụng chính hãng từ Samsung, Sony, Panasonic.",
    },
    {
      title: "Thi công & Lắp đặt Tận tâm",
      description:
        "Đội ngũ kỹ thuật viên giàu kinh nghiệm, đảm bảo quy trình lắp đặt chuẩn xác, an toàn.",
    },
    {
      title: "Bảo hành & Hỗ trợ Kỹ thuật",
      description:
        "Dịch vụ hậu mãi chu đáo, hỗ trợ xử lý sự cố nhanh chóng trong vòng 24h.",
    },
  ];

  const title = isShowingProducts ? "Sản phẩm nổi bật" : "Dịch vụ & Giải pháp";

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const ProductCard = ({ product }: { product: Product }) => {
    const productUrl = product.categories?.slug
      ? `/san-pham/${product.categories.slug}/${product.slug}`
      : `/san-pham/${product.slug}`;
    const hasDiscount = (product.discount_percent ?? 0) > 0;

    return (
      <Card className="group overflow-hidden hover:shadow-md transition-all duration-300 h-full flex flex-col">
        {/* Mobile: ảnh đầu tiên, không carousel */}
        <div className="block md:hidden">
          <Link href={productUrl}>
            <AspectRatio ratio={16 / 9}>
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-contain p-3"
                  sizes="90vw"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  No image
                </div>
              )}
            </AspectRatio>
          </Link>
        </div>

        {/* Desktop: carousel ảnh */}
        <div className="hidden md:block relative group/carousel">
          <Carousel className="w-full">
            <CarouselContent>
              {product.images?.length > 0 ? (
                product.images.map((img, idx) => (
                  <CarouselItem key={idx}>
                    <Link href={productUrl}>
                      <AspectRatio ratio={16 / 9}>
                        <Image
                          src={img}
                          alt={`${product.name} - ${idx + 1}`}
                          fill
                          className="object-contain p-3"
                          sizes="(max-width: 1024px) 33vw, 25vw"
                        />
                      </AspectRatio>
                    </Link>
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem>
                  <AspectRatio ratio={16 / 9}>
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                      No image
                    </div>
                  </AspectRatio>
                </CarouselItem>
              )}
            </CarouselContent>
            {product.images?.length > 1 && (
              <>
                <CarouselPrevious className="left-2 h-7 w-7 opacity-0 group-hover/carousel:enabled:opacity-100 disabled:invisible transition-opacity bg-background shadow-sm border-border" />
                <CarouselNext className="right-2 h-7 w-7 opacity-0 group-hover/carousel:enabled:opacity-100 disabled:invisible transition-opacity bg-background shadow-sm border-border" />
              </>
            )}
          </Carousel>
        </div>

        {/* Content */}
        <Link href={productUrl} className="flex-1">
          <CardContent className="p-3 md:p-4 flex flex-col gap-1.5 h-full">
            {product.sku && (
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                {product.sku}
              </span>
            )}
            <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:underline underline-offset-4 flex-1">
              {product.name}
            </h3>
            <div className="mt-2 flex flex-col gap-1">
              <span className="text-base md:text-lg font-bold tracking-tight">
                {formatPrice(product.sale_price || product.original_price)}
              </span>
              {hasDiscount && (
                <div className="flex items-center gap-2">
                  <span className="text-md text-muted-foreground line-through">
                    {formatPrice(product.original_price)}
                  </span>
                  <span className="text-xs font-bold bg-foreground text-background px-1.5 py-0.5 rounded-sm">
                    -{product.discount_percent}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  };

  const DefaultCard = ({
    feature,
    index,
  }: {
    feature: (typeof defaultFeatures)[0];
    index: number;
  }) => (
    <Card className="group p-5 flex flex-col hover:shadow-md transition-all duration-300 h-full">
      <span className="text-4xl font-newsreader opacity-60 mb-5">
        {String(index + 1).padStart(2, "0")}
      </span>
      <Separator className="mb-5" />
      <h3 className="text-sm font-medium mb-2 group-hover:underline underline-offset-4">
        {feature.title}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 flex-1">
        {feature.description}
      </p>
    </Card>
  );

  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-newsreader tracking-tight mb-10 md:mb-14">
          {title}
        </h2>

        {/* PRODUCT */}
        {isShowingProducts && (
          <>
            {/* Mobile: Carousel */}
            <div className="block md:hidden">
              <Carousel opts={{ align: "center", dragFree: false }}>
                <CarouselContent>
                  {products.map((product) => (
                    <CarouselItem key={product.id} className="basis-full">
                      <ProductCard product={product} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>

            {/* Tablet 3 cột, Desktop 4 cột */}
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {/* DEFAULT */}
        {!isShowingProducts && (
          <>
            {/* Mobile: 1 cột, không carousel */}
            <div className="grid grid-cols-1 md:hidden gap-4">
              {defaultFeatures.map((feature, i) => (
                <DefaultCard key={i} feature={feature} index={i} />
              ))}
            </div>

            {/* Tablet 2 cột, Desktop 4 cột */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {defaultFeatures.map((feature, i) => (
                <DefaultCard key={i} feature={feature} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
