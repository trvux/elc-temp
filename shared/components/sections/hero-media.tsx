import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { TypographyH1 } from "@/shared/components/ui/typography";
import { HeroSlideshow } from "./hero-slideshow";

const HERO_IMAGES = [
  "/images/1.jpg?v=2",
  "/images/2.jpg?v=2",
  "/images/3.jpg?v=2",
  // "/images/4.jpg",
  // "/images/5.jpg",
  // "/images/6.jpg",
  // "/images/7.jpg",
  // "/images/8.jpg",
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
    <Card className="dark w-full bg-card text-card-foreground border shadow-sm flex flex-col gap-6 overflow-hidden">
      <CardHeader className="flex flex-col items-center text-center px-6 pt-8 gap-4">
        <CardTitle>
          <TypographyH1 className="">{title}</TypographyH1>
        </CardTitle>
        <CardDescription className="max-w-2xl text-sm md:text-base text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <HeroSlideshow
          images={images}
          className="w-full"
          imageClassName="object-fill"
        />
      </CardContent>
    </Card>
  );
}
