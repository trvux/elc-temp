import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  original_price?: number | null;
  sale_price?: number | null;
  images: string[];
  categories?: { name: string };
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
  ];

  return (
    <section className="w-full max-w-7xl px-container py-section mx-auto relative">
      <div className="relative z-10 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-4 mb-8">
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">
              02 ━ Bộ sưu tập
            </span>
          </div>
          <h2 className="text-title font-light tracking-tighter mb-4 leading-tight text-foreground">
            Giải Pháp Thông Minh <br />
            <span className="text-muted-foreground/80 italic">
              Độc quyền bởi ELC.
            </span>
          </h2>
        </div>
        <p className="text-base-fluid text-muted-foreground max-w-sm leading-relaxed font-light mb-4 md:mb-0">
          Chúng tôi tinh tuyển những thiết kế và công nghệ hàng đầu toàn cầu để
          kiến tạo không gian hoàn mỹ.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid">
        {products.length > 0
          ? products.map((product, i) => (
              <Link
                key={product.id}
                href={`/san-pham/${product.slug}`}
                className="group relative flex flex-col items-start"
              >
                <div className="relative w-full aspect-[4/3] mb-5 rounded-[1.25rem] bg-background border border-border/40 shadow-sm overflow-hidden p-4 sm:p-6 transition-all duration-500 group-hover:shadow-md">
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-[1.5s] group-hover:scale-[1.05]"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 italic font-light bg-muted/50">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Floating button on hover */}
                  <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur text-foreground p-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-sm border border-border/50">
                    <ArrowRight className="h-4 w-4 stroke-[1.5px]" />
                  </div>
                </div>

                <div className="w-full flex justify-between items-start gap-4 mb-2 px-1">
                  <h3 className="text-xl font-medium tracking-tight text-foreground line-clamp-1 group-hover:italic transition-all">
                    {product.name}
                  </h3>
                  <span className="text-[10px] mt-1.5 uppercase tracking-widest text-muted-foreground font-medium whitespace-nowrap">
                    {product.categories?.name || "Sản phẩm"}
                  </span>
                </div>

                <p className="text-foreground text-sm font-medium px-1 tracking-wide">
                  {(product.sale_price || product.original_price) ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((product.sale_price || product.original_price) as number) : "Liên hệ"}
                </p>
              </Link>
            ))
          : defaultFeatures.map((feature, i) => (
              <div
                key={i}
                className="group relative flex flex-col items-start pt-8 border-t border-border"
              >
                <span className="text-[10px] text-muted-foreground mb-4 tracking-widest">
                  0{i + 1}
                </span>
                <h3 className="mb-3 text-xl font-medium tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed font-light text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
      </div>
    </section>
  );
}
