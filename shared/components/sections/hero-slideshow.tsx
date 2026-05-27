"use client";

import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/shared/components/ui/carousel";
import { getOptimizedImage } from "@/shared/lib/image";
import { cn } from "@/shared/lib/utils";
import { Pause, Play } from "@phosphor-icons/react";
import Image from "next/image";
import * as React from "react";

interface HeroSlideshowProps {
  images: string[];
  className?: string;
  imageClassName?: string;
}

export function HeroSlideshow({
  images,
  className,
  imageClassName,
}: HeroSlideshowProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    // Initialize
    setCurrentIndex(api.selectedScrollSnap());

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Auto play logic
  React.useEffect(() => {
    if (!isAutoPlaying || !api) return;

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, [isAutoPlaying, api]);

  const goToNext = () => {
    if (!api) return;
    if (api.canScrollNext()) {
      api.scrollNext();
    } else {
      api.scrollTo(0);
    }
  };

  const goToPrev = () => {
    if (!api) return;
    if (api.canScrollPrev()) {
      api.scrollPrev();
    } else {
      api.scrollTo(images.length - 1);
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying((prev) => !prev);
  };

  if (!images || images.length === 0) return null;

  return (
    <div className={cn("relative group overflow-hidden", className)}>
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "start" }}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {images.map((src, index) => (
            <CarouselItem key={index} className="pl-0 w-full relative">
              <AspectRatio
                ratio={16 / 9}
                className="block w-full h-full relative"
              >
                <Image
                  src={getOptimizedImage(src, 1600, 100, "cover")}
                  alt={`Slide ${index + 1}`}
                  fill
                  priority={index === 0}
                  unoptimized
                  draggable={false}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  className={cn("object-cover w-full h-full", imageClassName)}
                  sizes="100vw"
                />
              </AspectRatio>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Previous Button */}
      {/* <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10"
        aria-label="Previous slide"
      >
        <CaretLeft size={20} weight="bold" />
      </button> */}

      {/* Next Button */}
      {/* <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10"
          aria-label="Next slide"
        >
          <CaretRight size={20} weight="bold" />
        </button> */}

      {/* Bottom Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 z-10">
        <div className="flex items-center gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => api?.scrollTo(idx)}
              className={cn(
                "relative overflow-hidden h-1.5 rounded-full transition-all duration-300",
                currentIndex === idx
                  ? "w-8 bg-white/30" // Wider with transparent bg when active
                  : "w-1.5 bg-white/50 hover:bg-white/80",
              )}
              aria-label={`Go to slide ${idx + 1}`}
            >
              {currentIndex === idx && (
                <div
                  key={currentIndex}
                  className="absolute top-0 left-0 h-full w-full bg-white origin-left"
                  style={{
                    animation: `slide-progress 5s linear forwards`,
                    animationPlayState: isAutoPlaying ? "running" : "paused",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-white/30 mx-1" />

        <button
          onClick={toggleAutoPlay}
          className="text-white/80 hover:text-white transition-colors"
          aria-label={isAutoPlaying ? "Pause autoplay" : "Start autoplay"}
        >
          {isAutoPlaying ? (
            <Pause size={16} weight="fill" />
          ) : (
            <Play size={16} weight="fill" />
          )}
        </button>
      </div>
    </div>
  );
}
