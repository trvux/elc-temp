"use client";

import {
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import { TypographyH1, TypographyP } from "@/shared/components/ui/typography";
import { HeroSlideshow } from "./hero-slideshow";

const HERO_IMAGES = [
  "/images/1.jpg?v=2",
  "/images/2.jpg?v=2",
  "/images/3.jpg?v=2",
  "/images/4.jpg?v=2",
];

interface HeroMediaSectionProps {
  image?: string;
  title?: string;
  description?: string;
}

export function HeroMediaSection({
  image,
  title = "Trải nghiệm không gian sống lý tưởng",
  description = "Khám phá hình ảnh của hệ thống điều khí thông minh và các giải pháp tối ưu từng nhịp thở cho ngôi nhà.",
}: HeroMediaSectionProps) {
  const images = HERO_IMAGES;

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6">
      <StaggerContainer
        className="flex flex-col gap-4 w-full"
        immediate
      >
        {/* Title */}
        <div className="flex flex-col items-center text-center gap-3 mb-4 md:mb-10">
          <StaggerItem duration={0.25}>
            <TypographyH1>{title}</TypographyH1>
          </StaggerItem>
          <StaggerItem duration={0.25}>
            <TypographyP className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {description}
            </TypographyP>
          </StaggerItem>
        </div>

        <StaggerItem duration={0.25} className="w-full">
          <HeroSlideshow
            images={images}
            className="w-full"
            imageClassName="object-fill"
          />
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
