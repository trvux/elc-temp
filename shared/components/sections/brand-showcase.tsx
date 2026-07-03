"use client";

import { Brand } from "@/modules/brand/domain";
import {
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import { TypographyH2 } from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import Link from "next/link";

interface BrandShowcaseProps {
  brands: Brand[];
}

export function BrandShowcase({ brands = [] }: BrandShowcaseProps) {
  const styles = {
    section: "w-full flex flex-col items-center justify-center gap-6",

    container: "grid grid-cols-1 gap-12 w-full",
    header: "flex flex-col items-center text-center px-6",
    marqueeArea: "relative w-full max-w-screen-xl mx-auto overflow-hidden",
    marqueeTrack:
      "flex gap-8 md:gap-16 lg:gap-20 animate-marquee w-fit items-center py-2",
  };

  // If no brands, return null
  if (brands.length === 0) return null;

  return (
    <div className={styles.section}>
      <StaggerContainer className={styles.container} immediate>
        <StaggerItem className={styles.header}>
          <TypographyH2>Đối tác thương hiệu</TypographyH2>
        </StaggerItem>

        <StaggerItem>
          <div
            className={cn(
              styles.marqueeArea,
              "hover:pause-marquee mask-[linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]",
            )}
          >
            <div className={styles.marqueeTrack}>
              {/* Render twice for a seamless loop */}
              {[...brands, ...brands].map((brand, i) => {
                const url = `/san-pham?brands=${brand.slug}`;
                return (
                  <Link
                    key={`${brand.id}-${i}`}
                    href={url}
                    prefetch={false}
                    className="flex items-center justify-center h-12 md:h-16 px-6 shrink-0 select-none group transition-all duration-300"
                    title={`Xem sản phẩm từ thương hiệu ${brand.name}`}
                  >
                    {brand.logoUrl ? (
                      <div className="relative h-8 md:h-9 lg:h-10 w-24 md:w-28 lg:w-32">
                        <ImageWithSkeleton
                          src={brand.logoUrl}
                          alt={brand.name}
                          fill
                          loading="lazy"
                          sizes="(max-width: 768px) 96px, (max-width: 1024px) 112px, 128px"
                          className="object-contain opacity-90 group-hover:opacity-100 transition-all duration-300"
                          wrapperClassName="w-full h-full"
                        />
                      </div>
                    ) : (
                      <span className="text-sm md:text-base font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                        {brand.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
