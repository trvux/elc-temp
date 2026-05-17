import {
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
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
  let heroImage = image || "/images/hero-hvac.jpg";
  if (
    heroImage &&
    !heroImage.startsWith("/") &&
    !heroImage.startsWith("http")
  ) {
    heroImage = "/" + heroImage;
  }
  // --- STYLES ---
  const styles = {
    section: "flex flex-col items-center gap-12 md:gap-16 w-full",
    content:
      " flex flex-col gap-6 md:gap-8 items-center justify-center text-center max-w-5xl w-full px-4 sm:px-6",
    media:
      "relative w-full md:mx-0 rounded-3xl overflow-hidden bg-background/5 backdrop-blur-md border-2 border-border/20 p-1.5 shadow-sm",
    image: "object-cover rounded-2xl border-2 border-border/20 shadow-sm",
  };

  return (
    <section className={styles.section}>
      {/* Cụm Content */}
      <StaggerContainer className={styles.content} staggerDelay={0.08}>
        <StaggerItem duration={0.25}>
          <TypographyH1>{title}</TypographyH1>
        </StaggerItem>
        <StaggerItem duration={0.25}>
          <Separator className="w-24" />
        </StaggerItem>
        <StaggerItem duration={0.25}>
          <TypographyLead>{subtitle}</TypographyLead>
        </StaggerItem>

        <HeroContactActions contacts={contacts} />
      </StaggerContainer>
      {/* Cụm Media */}
      {/* <div className="relative w-full max-w-4xl flex justify-center">
        <div className="absolute -inset-10 md:-inset-20 bg-linear-to-tr from-blue-500/20 via-indigo-500/20 to-blue-500/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none -z-10" /> */}

      <div className={styles.media}>
        <AspectRatio ratio={16 / 9} className="block">
          <Image
            src={getOptimizedImage(heroImage, 1600, 100, "cover")}
            alt="ELC Space"
            fill
            priority
            unoptimized
            fetchPriority="high"
            className={styles.image}
            sizes="100vw"
            loading="eager"
          />
        </AspectRatio>
      </div>
      {/* </div> */}
    </section>
  );
}
