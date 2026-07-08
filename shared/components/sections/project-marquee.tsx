"use client";

import { ProjectWithCategory } from "@/modules/project/domain/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/shared/components/ui/carousel";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import { TypographyH2, TypographyP } from "@/shared/components/ui/typography";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import Link from "next/link";
import * as React from "react";

interface ProjectMarqueeSectionProps {
  title?: string;
  description?: string;
  projects?: ProjectWithCategory[];
}

export function ProjectMarqueeSection({
  title = "Dự án tiêu biểu nổi bật",
  description = "",
  projects = [],
}: ProjectMarqueeSectionProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (!api) return;

    const start = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => api.scrollNext(), 2500);
    };

    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.1 },
    );

    const el = containerRef.current;
    if (el) observer.observe(el);

    const onVisibility = () => (document.hidden ? stop() : (el && start()));
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [api]);

  const safeProjects = projects || [];
  if (safeProjects.length === 0) return null;

  const renderCard = (project: ProjectWithCategory, idx: number) => {
    const firstImage = primaryImageUrl(project.images) || "/placeholder.png";
    const projectUrl = `/du-an/${project.slug}`;

    return (
      <Link
        href={projectUrl}
        className="shrink-0 flex flex-col gap-4 group w-full block"
      >
        {/* Card Background Image without Overlay */}
        <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden border border-border/40 bg-muted shadow-sm transition-all duration-500 group-hover:shadow-md">
          {/* Background image */}
          <ImageWithSkeleton
            wrapperClassName="w-full h-full"
            src={firstImage}
            alt={project.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={idx < 3}
          />
        </div>

        {/* Text underneath */}
        <div className="flex flex-col gap-1.5 px-1">
          <h3 className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary leading-snug line-clamp-1">
            {project.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {project.metaDescription || project.title}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center justify-center gap-6">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-0">
        <Carousel
          setApi={setApi}
          opts={{
            align: "center",
            loop: true,
          }}
          className="w-full"
        >
          {/* Header row with title/description on left, arrows on right */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
            <div className="flex flex-col gap-3 max-w-3xl">
              <TypographyH2 className="text-left">{title}</TypographyH2>
              {description && (
                <TypographyP className="text-muted-foreground text-left leading-relaxed">
                  {description}
                </TypographyP>
              )}
            </div>
            <div className="flex gap-3 shrink-0 self-start md:self-end">
              <CarouselPrevious className="dark text-foreground static translate-y-0 h-9 w-9 rounded-full border-none flex items-center justify-center cursor-pointer" />
              <CarouselNext className="dark text-foreground static translate-y-0 h-9 w-9 rounded-full border-none flex items-center justify-center cursor-pointer" />
            </div>
          </div>

          {/* Carousel content */}
          <CarouselContent className="-ml-4 md:-ml-6">
            {safeProjects.map((project, idx) => (
              <CarouselItem
                key={project.id}
                className="pl-4 md:pl-6 basis-[70%] sm:basis-[38%] lg:basis-[24%]"
              >
                {renderCard(project, idx)}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
