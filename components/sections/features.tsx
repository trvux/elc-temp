import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  original_price?: number | null;
  sale_price?: number | null;
  images: string[];
  categories?: { name: string; slug: string };
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
        {/* 1. Sửa thẻ cha: mặc định 1 cột, từ md trở lên là 2 cột */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2">
          {products.length > 0
            ? products.map((product) => {
                const productUrl = product.categories?.slug
                  ? `/san-pham/${product.categories.slug}/${product.slug}`
                  : `/san-pham/${product.slug}`;
                return (
                  <Link
                    key={product.id}
                    href={productUrl}
                    /* Thêm border và margin âm nếu bạn muốn nó trông giống như một cái lưới ô bàn cờ */
                    className="group relative flex flex-col gap-4 p-6 border border-border -ml-[1px] -mt-[1px] hover:bg-accent/50 transition-all"
                  >
                    <Card className="relative w-full aspect-[4/3] overflow-hidden p-0 sm:p-6 bg-transparent sm:bg-background border-0 sm:border sm:border-border/40 shadow-none ring-0 gap-0 py-0 rounded-[1.25rem] transition-shadow duration-500 sm:group-hover:shadow-md">
                      <div className="relative w-full h-full rounded-lg overflow-hidden">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-[1.5s] group-hover:scale-[1.05]"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 italic font-light bg-muted/50">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur text-foreground p-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-sm border border-border/50">
                        <ArrowRight className="h-4 w-4 stroke-[1.5px]" />
                      </div>
                    </Card>

                    <div className="w-full flex justify-between items-start gap-4 px-1">
                      <h3 className="text-xl font-medium tracking-tight text-foreground line-clamp-1 group-hover:italic transition-all">
                        {product.name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="mt-0.5 text-[10px] uppercase tracking-widest font-medium whitespace-nowrap shrink-0"
                      >
                        {product.categories?.name || "Sản phẩm"}
                      </Badge>
                    </div>

                    <p className="text-foreground text-sm font-medium px-1 tracking-wide -mt-2">
                      {product.sale_price || product.original_price
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(
                            (product.sale_price ||
                              product.original_price) as number,
                          )
                        : "Liên hệ"}
                    </p>
                  </Link>
                );
              })
            : defaultFeatures.map((feature, i) => (
                /* 2. Phần fallback cũng sửa tương tự cho đồng bộ */
                <div
                  key={i}
                  className="p-8 group relative flex flex-col items-start border border-border -ml-[1px] -mt-[1px] hover:bg-foreground transition-all duration-300 ease-in-out cursor-pointer"
                >
                  <span className="text-[10px] text-muted-foreground mb-4 tracking-widest uppercase group-hover:text-background/70 transition-colors">
                    0{i + 1}
                  </span>

                  <h3 className="mb-3 text-xl font-medium tracking-tight uppercase text-foreground group-hover:text-background transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed font-light text-sm group-hover:text-background/80 transition-colors">
                    {feature.description}
                  </p>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
