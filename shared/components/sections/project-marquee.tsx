"use client";

import { ProjectWithCategory } from "@/modules/project/domain/types";

import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { TypographyH1, TypographyP } from "@/shared/components/ui/typography";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import Link from "next/link";
import * as React from "react";

interface ProjectMarqueeSectionProps {
  title?: string;
  description?: string;
  projects?: ProjectWithCategory[];
}

export function ProjectMarqueeSection({
  title = "Dự án tiêu biểu nổi bật",
  description = "Xem qua các dự án điều hòa trung tâm và lọc khí tươi tiêu biểu đã được ELC thi công hoàn thiện.",
  projects = [],
}: ProjectMarqueeSectionProps) {
  // Smart project short-title extractor
  const getShortTitle = (project: ProjectWithCategory) => {
    const match =
      project.title.match(/(?:tại|Tại|cho|Cho)\s+(.+)$/) ||
      project.title.match(/-\s+([^-]+)$/);
    return match && match[1]
      ? match[1].trim().charAt(0).toUpperCase() + match[1].trim().slice(1)
      : project.title;
  };

  const safeProjects = projects || [];

  // Group projects into two separate lists for two marquee rows
  const row1 = safeProjects.filter((_, idx) => idx % 2 === 0);
  const row2 = safeProjects.filter((_, idx) => idx % 2 === 1);

  // Target length for the base row to ensure equal physical widths and speeds
  const TARGET_LENGTH = 18;

  // Build perfectly sized rows with identical length for speed matching
  const baseRow1 = React.useMemo(() => {
    if (row1.length === 0) return [];
    const result: ProjectWithCategory[] = [];
    while (result.length < TARGET_LENGTH) {
      result.push(...row1);
    }
    return result.slice(0, TARGET_LENGTH);
  }, [row1]);

  const baseRow2 = React.useMemo(() => {
    if (row2.length === 0) return [];
    const result: ProjectWithCategory[] = [];
    while (result.length < TARGET_LENGTH) {
      result.push(...row2);
    }
    return result.slice(0, TARGET_LENGTH);
  }, [row2]);

  if (!projects || projects.length === 0) return null;

  const renderCard = (project: ProjectWithCategory, idx: number) => {
    const shortTitle = getShortTitle(project);
    const firstImage = project.images?.[0] || "/placeholder.png";
    const projectUrl = `/du-an/${project.slug}`;
    const categoryName =
      project.category?.name || project.projectType?.name || "Dự án";

    return (
      <Link
        key={`${project.id}-${idx}`}
        href={projectUrl}
        className="shrink-0 w-64 sm:w-72 md:w-80 hover:-translate-y-1 transition-transform duration-300"
      >
        <Card size="sm" className="h-full gap-0 py-0">
          {/* Title on top */}
          <CardHeader className="px-3 pt-3 pb-2">
            <Badge variant="secondary" className="w-fit">
              {categoryName}
            </Badge>
            <CardTitle className="line-clamp-1 leading-snug">
              {shortTitle}
            </CardTitle>
          </CardHeader>

          {/* Image in the middle */}
          <CardContent className="px-3 py-0">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
              <ImageWithSkeleton
                wrapperClassName="w-full h-full"
                src={firstImage}
                alt={project.title}
                fill
                sizes="(max-width: 640px) 256px, (max-width: 768px) 288px, 320px"
                className="object-cover"
                priority={idx < 3}
              />
            </div>
          </CardContent>

          {/* Description at the bottom */}
          <CardContent className="px-3 pt-2 pb-3">
            <CardDescription className="line-clamp-2 text-[11px] leading-relaxed">
              {project.title}
            </CardDescription>
          </CardContent>
        </Card>
      </Link>
    );
  };

  // Row renderer using the shadcn studio multi-track pattern:
  // 3 identical track divs in a flex container, each animated with translateX(-100%).
  // CSS mask-image on the parent fades edges without any colored overlay.
  const renderMarqueeRow = (
    items: ProjectWithCategory[],
    isReverse: boolean,
    durationSeconds: number,
  ) => {
    if (items.length === 0) return null;

    const trackClass =
      "flex shrink-0 justify-around gap-5 animate-marquee-horizontal group-hover:[animation-play-state:paused]";

    const trackStyle: React.CSSProperties = {
      animationDirection: isReverse ? "reverse" : "normal",
      animationDuration: `${durationSeconds}s`,
    };

    return (
      <div
        className="group flex gap-5 overflow-hidden p-3 mask-[linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]"
      >
        <div className={trackClass} style={trackStyle}>
          {items.map((project, idx) => renderCard(project, idx))}
        </div>
        <div className={trackClass} style={trackStyle}>
          {items.map((project, idx) =>
            renderCard(project, idx + TARGET_LENGTH),
          )}
        </div>
        <div className={trackClass} style={trackStyle}>
          {items.map((project, idx) =>
            renderCard(project, idx + TARGET_LENGTH * 2),
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6">
      <div className="flex flex-col gap-4 w-full">
        {/* Title */}
        <div className="flex flex-col items-center text-center gap-3 mb-4 md:mb-10">
          <TypographyH1>{title}</TypographyH1>
          <TypographyP className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {description}
          </TypographyP>
        </div>

        {/* Dynamic Double Row Marquee */}
        <div className="w-full flex flex-col gap-2">
          {/* Row 1: Right to Left */}
          {baseRow1.length > 0 && renderMarqueeRow(baseRow1, false, 200)}

          {/* Row 2: Left to Right */}
          {baseRow2.length > 0 && renderMarqueeRow(baseRow2, true, 200)}
        </div>
      </div>
    </div>
  );
}
