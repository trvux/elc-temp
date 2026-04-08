import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
  // If no products, show the default features (could happen if DB is empty)
  const defaultFeatures = [
    {
      title: "Tư vấn & Thiết kế",
      description:
        "Giải pháp chuyên biệt dành cho kiến trúc cao cấp và biệt thự nghỉ dưỡng.",
    },
    {
      title: "Cung ứng thiết bị",
      description:
        "Hợp tác chiến lược cùng Samsung, Sony, Panasonic, LG - đảm bảo chính hãng 100%.",
    },
    {
      title: "Thi công hoàn thiện",
      description:
        "Đội ngũ chuyên gia kỹ thuật đảm bảo tính thẩm mỹ tuyệt đối và hiệu suất tối ưu.",
    },
    {
      title: "Thi công hoàn thiện",
      description:
        "Đội ngũ chuyên gia kỹ thuật đảm bảo tính thẩm mỹ tuyệt đối và hiệu suất tối ưu.",
    },
  ];

  return (
    <section className="flex-1 flex flex-col justify-center w-full relative">
      <div className="pt-24 max-w-7xl px-container pt-section pb-20 sm:pb-28 lg:pb-44 mx-auto w-full">
        {/* Header */}
        <div className="relative z-10 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-4 mb-8">
              <Badge
                variant="outline"
                className="text-[10px] capitalize tracking-[0.25em] font-medium px-3 py-1 h-auto rounded-full border-border/50"
              >
                02 ━ Bộ sưu tập
              </Badge>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter mb-4 leading-tight text-foreground">
              Giải Pháp Thông Minh <br />
              <span className="text-muted-foreground/80 italic">
                Độc quyền bởi ELC.
              </span>
            </h2>
          </div>
          <p className="text-sm md:text-base text-muted-foreground max-w-sm leading-relaxed font-light mb-4 md:mb-0">
            Chúng tôi tinh tuyển những thiết kế và công nghệ hàng đầu toàn cầu
            để kiến tạo không gian hoàn mỹ.
          </p>
        </div>

        {/* Grid */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-4">
          {products.length > 0
            ? products.map((product) => {
                const productUrl = product.categories?.slug
                  ? `/san-pham/${product.categories.slug}/${product.slug}`
                  : `/san-pham/${product.slug}`;

                const hasDiscount = (product.discount_percent ?? 0) > 0;

                return (
                  <Link
                    key={product.id}
                    href={productUrl}
                    className="group relative flex flex-col gap-5 p-6 border border-border -ml-[1px] -mt-[1px] bg-background transition-all duration-500 hover:z-20"
                  >
                    <div className="w-full overflow-hidden bg-muted/5 relative">
                      <AspectRatio ratio={4 / 3}>
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-contain p-4 transition-transform duration-1000 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-[10px] font-bold capitalize tracking-[0.3em]">
                            Ảnh SP
                          </div>
                        )}
                      </AspectRatio>
                    </div>

                    <div className="flex flex-col flex-1">
                      <div className="min-h-[3rem] flex flex-col items-start gap-2 mb-3">
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-2 py-0.5 uppercase tracking-widest font-medium whitespace-nowrap shrink-0 w-fit h-auto rounded-sm"
                        >
                          {product.categories?.parent?.name
                            ? `${product.categories.parent.name} / ${product.categories.name}`
                            : product.categories?.name || "Sản phẩm"}
                        </Badge>
                        <h3 className="text-sm md:text-base font-bold text-foreground leading-snug tracking-tight capitalize line-clamp-2 transition-all group-hover:italic">
                          {product.name}
                        </h3>
                      </div>

                      <div className="flex flex-col mb-4">
                        <span className="text-muted-foreground/60 font-bold tracking-[0.08em] text-[9px] uppercase">
                          SKU
                        </span>
                        <span className="text-foreground/80 font-semibold tracking-[0.05em] text-xs uppercase">
                          {product.sku || "0000/000"}
                        </span>
                      </div>

                      <div className="mt-auto border-t border-border/40 pt-4 flex flex-col gap-1.5 h-16">
                        {hasDiscount ? (
                          <>
                            <span className=" font-bold text-foreground tracking-tight text-xl sm:text-2xl block leading-none">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(product.sale_price || 0)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground line-through text-[11px] font-semibold">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(product.original_price)}
                              </span>
                              <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-border/80 bg-background flex-shrink-0 flex-grow-0 h-fit">
                                <span className="text-[9px] font-bold text-foreground tracking-tighter">
                                  -{product.discount_percent}
                                </span>
                                <Percent
                                  className="w-2.5 h-2.5"
                                  strokeWidth={2.5}
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <span className="font-bold text-foreground tracking-tight text-xl sm:text-2xl block leading-none">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(product.original_price)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 bg-background/90 backdrop-blur text-foreground p-2.5 rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-sm border border-border/50 z-20">
                      <ArrowRight className="h-3 w-3 stroke-[1.5px]" />
                    </div>
                  </Link>
                );
              })
            : defaultFeatures.map((feature, i) => (
                /* 2. Phần fallback cũng sửa tương tự cho đồng bộ */
                <div
                  key={i}
                  className="p-6 group relative flex flex-col items-start border border-border -ml-[1px] -mt-[1px] hover:bg-foreground transition-all duration-300 ease-in-out cursor-pointer hover:z-20"
                >
                  <span className="text-[10px] text-muted-foreground mb-4 tracking-widest uppercase group-hover:text-background/70 transition-colors">
                    0{i + 1}
                  </span>

                  <h3 className="mb-3 text-sm md:text-base font-medium tracking-tight uppercase text-foreground group-hover:text-background transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed font-light text-xs md:text-sm group-hover:text-background/80 transition-colors">
                    {feature.description}
                  </p>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
