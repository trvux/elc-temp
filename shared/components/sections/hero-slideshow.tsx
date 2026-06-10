"use client";

import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/shared/components/ui/carousel";
import { cn } from "@/shared/lib/utils";
import { Pause, Play } from "@phosphor-icons/react";
import Image from "next/image";
import * as React from "react";

import { Button } from "@/shared/components/ui/button";

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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [api, setApi] = React.useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);
  const [isVisible, setIsVisible] = React.useState(false);

  // Intersection Observer to detect visibility
  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
      },
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, []);

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
    if (!isAutoPlaying || !isVisible || !api) return;

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, [isAutoPlaying, isVisible, api]);

  const toggleAutoPlay = () => {
    setIsAutoPlaying((prev) => !prev);
  };

  if (!images || images.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn("relative group select-none flex flex-col", className)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="relative p-1 md:p-2 rounded-2xl bg-muted backdrop-blur-sm border border-border overflow-hidden">
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: "start" }}
          className="w-full rounded-xl overflow-hidden"
        >
          <CarouselContent className="ml-0">
            {images.map((src, index) => (
              <CarouselItem key={index} className="pl-0 w-full relative">
                <AspectRatio
                  ratio={16 / 9}
                  className="block w-full h-full relative"
                >
                  <Image
                    src={src}
                    alt={`Slide ${index + 1}`}
                    fill
                    quality={90}
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                    draggable={false}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    className={cn("object-cover w-full h-full", imageClassName)}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, 1600px"
                  />
                </AspectRatio>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Previous Button */}
      {/* <Button
        variant="ghost"
        size="icon"
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 hover:text-white z-10"
        aria-label="Previous slide"
      >
        <CaretLeft size={20} weight="bold" />
      </Button> */}

      {/* Next Button */}
      {/* <Button
        variant="ghost"
        size="icon"
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 hover:text-white z-10"
        aria-label="Next slide"
      >
        <CaretRight size={20} weight="bold" />
      </Button> */}

      {/* Bottom Control Bar */}
      <div className="relative md:absolute mt-4 md:mt-0 md:bottom-6 left-auto md:left-1/2 translate-x-0 md:-translate-x-1/2 mx-auto md:mx-0 flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 z-10 w-fit">
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
                  key={`${currentIndex}-${isVisible}`}
                  className="absolute top-0 left-0 h-full w-full bg-white origin-left"
                  style={{
                    animation: `slide-progress 5s linear forwards`,
                    animationPlayState:
                      isAutoPlaying && isVisible ? "running" : "paused",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-white/30 mx-1" />

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleAutoPlay}
          className="text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          aria-label={isAutoPlaying ? "Pause autoplay" : "Start autoplay"}
        >
          {isAutoPlaying ? (
            <Pause size={16} weight="fill" />
          ) : (
            <Play size={16} weight="fill" />
          )}
        </Button>
      </div>
    </div>
  );
}
