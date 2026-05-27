import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { HeroSlideshow } from "./hero-slideshow";

const HERO_IMAGES = [
  "/images/1.jpg",
  "/images/2.jpg",
  "/images/3.jpg",
  "/images/4.jpg",
  "/images/5.jpg",
  "/images/6.jpg",
  "/images/7.jpg",
  "/images/8.jpg",
];

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
  const images = HERO_IMAGES;

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
        <HeroSlideshow
          images={images}
          className="w-full"
          imageClassName="object-cover"
        />
      </CardContent>
    </Card>
  );
}
