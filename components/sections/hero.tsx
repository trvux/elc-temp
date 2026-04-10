import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function HeroSection({
  title,
  subtitle,
  ctaText,
  ctaUrl,
}: HeroSectionProps) {
  const displayTitle = title || "Giải pháp Không khí thuần khiết.";
  const displaySubtitle =
    subtitle ||
    "Xóa bỏ ranh giới giữa bên trong và thiên nhiên. Hệ thống điều khí thông minh từ ELC tự động tối ưu từng nhịp thở cho ngôi nhà của bạn.";
  const displayCtaText = ctaText || "Bắt đầu ngay";
  const displayCtaUrl = ctaUrl || "/cong-trinh";

  return (
    <section className="pt-36 max-w-screen-2xl lg:mx-auto ">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center justify-between">
        {/* Cột trái */}
        <div className="flex flex-col gap-8">
          <h1 className="font-newsreader text-4xl sm:text-6xl lg:text-7xl leading-tight tracking-tighter">
            {displayTitle}
          </h1>

          <Separator />

          <p className="text-base xl:text-lg text-foreground leading-relaxed">
            {displaySubtitle}
          </p>

          <div>
            <Button
              asChild
              size="lg"
              className="w-full md:w-auto px-10 py-6 text-base font-semibold"
            >
              <Link href={displayCtaUrl}>{displayCtaText}</Link>
            </Button>
          </div>
        </div>

        {/* Cột phải */}
        <div className="relative aspect-square w-full">
          <Image
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80"
            alt="ELC không gian sống"
            fill
            priority
            className="object-cover rounded-2xl"
            sizes="(max-width: 1280px) 100vw, 800px"
          />
        </div>
      </div>
    </section>
  );
}
