import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  coverImage?: string;
}

export function HeroSection({
  title,
  subtitle,
  ctaText,
  ctaUrl,
  coverImage,
}: HeroSectionProps) {
  // Use defaults if settings aren't populated yet
  const displayTitle = title || "Giải pháp Không khí thuần khiết.";
  const displaySubtitle =
    subtitle ||
    "Xóa bỏ ranh giới giữa bên trong và thiên nhiên. Hệ thống điều khí thông minh từ ELC tự động tối ưu từng nhịp thở cho ngôi nhà của bạn.";
  const displayCtaText = ctaText || "Bắt đầu ngay";
  const displayCtaUrl = ctaUrl || "/cong-trinh";

  // Split title carefully to extract key words for styling
  const words = displayTitle.split(" ");
  const firstHalf = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const secondHalf = words.slice(Math.ceil(words.length / 2)).join(" ");

  return (
    <section className="relative flex min-h-screen w-full flex-col pt-24 pb-12 sm:pb-24 justify-center layout-container">
      {/* Background Layer */}
      <div className="absolute inset-0 -z-10 bg-background"></div>

      {/* Delicate floating background images if available */}
      {coverImage && (
        <div className="absolute inset-0 -z-[5] overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] mix-blend-multiply dark:mix-blend-screen scale-105 blur-2xl">
            <Image
              src={coverImage}
              alt="ELC Background"
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Subtle noise texture */}
          <div
            className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
            }}
          ></div>
        </div>
      )}

      {/* Center: Massive Editorial Headline & Main Content */}
      <div className="layout-container relative z-10">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-24">
          {/* Left Column: Bold Headline & Buttons */}
          <div className="w-full lg:w-2/3 flex flex-col items-start animate-in fade-in slide-in-from-bottom-12 duration-[1.5s]">
            {/* Optional: Partner badge if you still want it */}
            <Badge
              variant="outline"
              className="mb-10 h-auto gap-2.5 rounded-full border-border bg-background px-2.5 py-1 backdrop-blur-xl font-normal"
            >
              <div className="flex -space-x-2">
                {["samsung.com", "sony.com", "lg.com", "panasonic.com"].map(
                  (domain, i) => (
                    <div
                      key={i}
                      className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-border bg-card shadow-sm transition-all duration-500 ease-in-out hover:scale-125 hover:z-30 hover:mx-1 cursor-default"
                    >
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                        alt={domain}
                        className="h-[55%] w-[55%] object-contain"
                      />
                    </div>
                  ),
                )}
              </div>
              <div className="flex items-center border-l border-border/50 pl-2 pr-1 text-xs font-base  capitalize">
                <span>Partners</span>
              </div>
            </Badge>

            <h1 className="font-sans font-bold text-foreground text-[clamp(2.2rem,6vw,4.8rem)] leading-[1.02] tracking-[-0.03em] text-left w-full group cursor-default">
              {displayTitle}
            </h1>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button
                asChild
                size="lg"
                className="group relative px-8 font-bold h-10"
              >
                <Link href={displayCtaUrl}>
                  <span className="relative z-10">{displayCtaText}</span>
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="group relative px-8 h-10 "
              >
                <Link href="/san-pham">Bộ sưu tập</Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Serif Subtitle */}
          <div className="w-full lg:w-[30%] lg:pt-20 flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <p className="font-newsreader text-[clamp(1rem,1.5vw,1.2rem)] text-muted-foreground/80 leading-relaxed text-left italic border-l-[1px] border-border/20 pl-6 lg:pl-0 lg:border-none">
              {displaySubtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
