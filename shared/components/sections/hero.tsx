import {
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import { Separator } from "@/shared/components/ui/separator";
import {
  TypographyH1,
  TypographyLead,
} from "@/shared/components/ui/typography";
import { getOptimizedImage } from "@/shared/lib/image";
import Image from "next/image";

import { Contact } from "@/modules/contact/domain";
import { HeroContactActions } from "./hero-contact-actions";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  image?: string;
  contacts?: Contact[];
}

export function HeroSection({
  title = "Giải pháp Không khí thuần khiết.",
  subtitle = "Xóa bỏ ranh giới giữa bên trong và thiên nhiên. Hệ thống điều khí thông minh từ ELC tự động tối ưu từng nhịp thở cho ngôi nhà của bạn.",
  image,
  contacts = [],
}: HeroSectionProps) {
  // Đảm bảo luôn có ảnh mặc định và luôn là đường dẫn tuyệt đối (có dấu / ở đầu)
  let heroImage = image || "/images/img-herosection.webp";
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
    media:
      "relative w-full aspect-square md:aspect-auto md:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl",
    image: "object-cover",
  };

  return (
    <section className={styles.section}>
      {/* Cụm Content */}
      <StaggerContainer className={styles.content} staggerDelay={0.08}>
        <StaggerItem duration={0.25}>
          <TypographyH1>{title}</TypographyH1>
        </StaggerItem>
        <StaggerItem duration={0.25}>
          <Separator />
        </StaggerItem>
        <StaggerItem duration={0.25}>
          <TypographyLead>{subtitle}</TypographyLead>
        </StaggerItem>

        <HeroContactActions contacts={contacts} />
      </StaggerContainer>

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
