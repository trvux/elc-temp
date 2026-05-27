import fs from "fs";
import path from "path";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { HeroSlideshow } from "./hero-slideshow";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
]);

/** Read all image files from public/images at server render time */
function getLocalHeroImages(): string[] {
  const dir = path.join(process.cwd(), "public", "images");
  try {
    return fs
      .readdirSync(dir)
      .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .map((file) => `/images/${file}`);
  } catch {
    return [];
  }
}

interface HeroMediaSectionProps {
  image?: string;
  title?: string;
  description?: string;
}

export function HeroMediaSection({
  image,
  title = "Trải nghiệm Không gian sống Lý tưởng",
  description = "Khám phá hình ảnh của hệ thống điều khí thông minh và các giải pháp tối ưu từng nhịp thở cho ngôi nhà.",
}: HeroMediaSectionProps) {
  const localImages = getLocalHeroImages();

  const images =
    localImages.length > 0 ? localImages : ["/images/img-hero.jpg"];

  return (
    <Card className="dark w-full bg-card text-card-foreground border shadow-sm flex flex-col gap-6 overflow-hidden">
      <CardHeader className="flex flex-col gap-2 items-center text-center px-6 pt-8">
        <CardTitle className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="max-w-2xl text-sm md:text-base text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <div className="relative p-1 md:p-2 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 shadow-2xl">
          <HeroSlideshow
            images={images}
            className="w-full rounded-xl overflow-hidden"
            imageClassName="object-cover"
          />
        </div>
      </CardContent>
    </Card>
  );
}
