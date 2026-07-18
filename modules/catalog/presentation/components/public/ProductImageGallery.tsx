"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { WishlistButton } from "@/shared/components/layout/user/wishlist-button";
import { Spotlight } from "@/shared/components/motion-primitives/spotlight";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/shared/components/ui/carousel";
import { cn } from "@/shared/lib/utils";

interface GalleryImage {
  url: string;
  alt?: string | null;
}

interface ProductImageGalleryProps {
  productId: string;
  images: GalleryImage[];
  fallbackAlt: string;
}

// Extracted to its own client component because the thumbnail strip needs
// to track/drive the main Carousel's selected slide (embla's own API,
// via setApi) — state a server component (ProductDetailModule) can't hold.
export function ProductImageGallery({ productId, images, fallbackAlt }: ProductImageGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full bg-white border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <Spotlight size={280} />
        <div className="absolute top-3 right-3 z-40">
          <WishlistButton productId={productId} size="icon" />
        </div>
        <Carousel className="w-full" setApi={setApi}>
          <CarouselContent>
            {images.length > 0 ? (
              images.map((img, i) => (
                <CarouselItem key={i}>
                  <AspectRatio ratio={16 / 9}>
                    <Image
                      src={img.url}
                      alt={img.alt || fallbackAlt}
                      fill
                      className="object-contain p-4"
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                    />
                  </AspectRatio>
                </CarouselItem>
              ))
            ) : (
              <CarouselItem>
                <AspectRatio ratio={4 / 3}>
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs tracking-widest">
                    Chưa có ảnh
                  </div>
                </AspectRatio>
              </CarouselItem>
            )}
          </CarouselContent>
        </Carousel>
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => api?.scrollTo(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              className={cn(
                "relative shrink-0 size-16 md:size-18 rounded-lg border-2 overflow-hidden bg-white transition-colors",
                i === selectedIndex ? "border-primary" : "border-border/50 hover:border-border",
              )}
            >
              <Image
                src={img.url}
                alt={img.alt || `${fallbackAlt} - ảnh ${i + 1}`}
                fill
                className="object-contain p-1"
                sizes="72px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
