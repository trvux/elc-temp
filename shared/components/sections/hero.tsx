import { AnimateIn } from "@/shared/components/ui/animate-in";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  TypographyH1,
  TypographyLead,
} from "@/shared/components/ui/typography";
import { getOptimizedImage } from "@/shared/lib/image";
import Image from "next/image";
import Link from "next/link";
import { HeroContactButton } from "./hero-contact-button";

import { Contact } from "@/modules/contact/domain";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  image?: string;
  contacts?: Contact[];
}

export function HeroSection({
  title = "Giải pháp Không khí thuần khiết.",
  subtitle = "Xóa bỏ ranh giới giữa bên trong và thiên nhiên. Hệ thống điều khí thông minh từ ELC tự động tối ưu từng nhịp thở cho ngôi nhà của bạn.",
  ctaText = "Bắt đầu ngay",
  ctaUrl = "/du-an",
  image,
  contacts = [],
}: HeroSectionProps) {
  // Đảm bảo luôn có ảnh mặc định và luôn là đường dẫn tuyệt đối (có dấu / ở đầu)
  let heroImage = image || "/img-herosection.jpg";
  if (
    heroImage &&
    !heroImage.startsWith("/") &&
    !heroImage.startsWith("http")
  ) {
    heroImage = "/" + heroImage;
  }
  // --- STYLES ---
  const styles = {
    section:
      "grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center min-h-[60vh]",

    content: "flex flex-col gap-6 md:gap-8",
    actions: "grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 w-full",
    btn: "w-full lg:w-auto",
    contact: "w-full lg:w-auto",
    media:
      "relative w-full aspect-square md:aspect-auto md:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl",
    image: "object-cover",
  };

  return (
    <section className={styles.section}>
      {/* Cụm Content */}
      <AnimateIn className={styles.content}>
        <TypographyH1>{title}</TypographyH1>
        <Separator />
        <TypographyLead>{subtitle}</TypographyLead>

        <div className={styles.actions}>
          <Button asChild size="lg" variant="secondary" className={styles.btn}>
            <Link href={ctaUrl}>{ctaText}</Link>
          </Button>

          <HeroContactButton className={styles.contact} contacts={contacts} />
        </div>
      </AnimateIn>

      {/* Cụm Media - KHÔNG bọc AnimateIn để bảo vệ LCP */}
      <div className={styles.media}>
        <Image
          src={getOptimizedImage(heroImage, 1200, 75, "cover")}
          alt="ELC Space"
          fill
          priority
          unoptimized
          fetchPriority="high"
          className={styles.image}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
          loading="eager"
        />
      </div>
    </section>
  );
}
