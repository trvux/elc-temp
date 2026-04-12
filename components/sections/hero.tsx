import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { getOptimizedImage } from "@/lib/image";
import { HeroContactButton } from "./hero-contact-button";

interface Contact {
  id: string;
  type: string;
  label: string;
  value: string;
  order_index: number;
}

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  image?: string;
  contacts?: Contact[];
}

export function HeroSection({
  title,
  subtitle,
  ctaText,
  ctaUrl,
  image,
  contacts = [],
}: HeroSectionProps) {
  const displayTitle = title || "Giải pháp Không khí thuần khiết.";
  const displaySubtitle =
    subtitle ||
    "Xóa bỏ ranh giới giữa bên trong và thiên nhiên. Hệ thống điều khí thông minh từ ELC tự động tối ưu từng nhịp thở cho ngôi nhà của bạn.";
  const displayCtaText = ctaText || "Bắt đầu ngay";
  const displayCtaUrl = ctaUrl || "/cong-trinh";
  const displayImage = image || "/img-herosection.jpg";

  return (
    <section className="pt-36 max-w-screen-2xl lg:mx-auto ">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center justify-between">
        {/* Cột trái */}
        <div className="flex flex-col gap-8">
          <h1 className="font-newsreader text-4xl sm:text-6xl lg:text-7xl leading-tight tracking-tighter">
            {displayTitle}
          </h1>

          <Separator />

          <p className="text-base xl:text-lg text-foreground leading-relaxed">
            {displaySubtitle}
          </p>

          {/* Button Layout Group */}
          <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
            {/* Button Chính */}
            <Button
              asChild
              size="lg"
              className="w-full h-12 text-base font-semibold md:col-span-7 lg:col-span-6 xl:col-span-6"
            >
              <Link href={displayCtaUrl}>{displayCtaText}</Link>
            </Button>

            {/* Button Phụ (Direct Link + Cycling) */}
            <HeroContactButton contacts={contacts} />
          </div>
        </div>

        {/* Cột phải */}
        <div className="relative aspect-square w-full">
          <Image
            src={getOptimizedImage(displayImage)}
            alt="ELC không gian sống"
            fill
            priority
            fetchPriority="high"
            className="object-cover rounded-2xl"
            sizes="(max-width: 1280px) 100vw, 800px"
          />
        </div>
      </div>
    </section>
  );
}
