import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TypographyH1, TypographyLead } from "@/components/ui/typography";
import { getOptimizedImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
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
  const displayCtaUrl = ctaUrl || "/du-an";
  const displayImage = image || "/img-herosection.jpg";

  const HeroSectionLayout = cn(
    // 1. Khung Grid tổng (Responsive Column)
    "grid grid-cols-1 gap-12 p-4 max-w-7xl mx-auto items-center min-h-[60vh]",
    "md:grid-cols-2 md:gap-16", // Tăng gap ngang trên desktop cho sang

    // 2. Định nghĩa Spacing cho cụm TEXT (Cột 1)
    // Dùng class [&>*]: để ép khoảng cách cho tất cả con trực tiếp bên trong
    "[&>div:first-child]:flex [&>div:first-child]:flex-col",
    "[&>div:first-child]:gap-6 md:[&>div:first-child]:gap-8", // Spacing giữa h1, separator, lead

    // 3. Media (Cột 2)
    "[&>div:last-child]:relative [&>div:last-child]:w-full [&>div:last-child]:aspect-square md:[&>div:last-child]:aspect-auto md:[&>div:last-child]:h-full [&>div:last-child]:rounded-3xl [&>div:last-child]:overflow-hidden",
  );
  return (
    <section className={HeroSectionLayout}>
      {/* Cụm Content: Khoảng cách giữa các phần tử ở đây do cha quản lý */}
      <div>
        <TypographyH1>{displayTitle}</TypographyH1>
        <Separator />
        <TypographyLead>{displaySubtitle}</TypographyLead>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 w-full">
          <Button asChild size="lg" className="w-full lg:w-auto ">
            <Link href={displayCtaUrl}>{displayCtaText}</Link>
          </Button>

          <Button size="lg" variant="outline">
            <HeroContactButton contacts={contacts} />
          </Button>
        </div>
      </div>

      {/* Cụm Media */}
      <div className="shadow-2xl">
        <Image
          src={getOptimizedImage(displayImage, 1200)}
          alt="ELC Space"
          fill
          priority
          fetchPriority="high"
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
          loading="eager"
        />
      </div>
    </section>
  );
}
