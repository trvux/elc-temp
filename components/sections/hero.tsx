import { Button } from "@/components/ui/button";
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
    <section className="relative flex min-h-screen w-full flex-col px-container pt-24 sm:pt-section pb-12 sm:pb-24 justify-center border-b border-border/50">
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
      <div className="flex flex-col justify-center items-center relative z-10 w-full animate-in fade-in slide-in-from-bottom-12 duration-[1.5s]">
        {/* Partner badge - centered, all breakpoints */}
        <div className="flex items-center gap-2.5 mb-8 rounded-full border border-border/50 bg-background/60 px-2.5 py-1 backdrop-blur-xl">
          <div className="flex -space-x-1.5">
            {["samsung.com", "sony.com", "lg.com", "panasonic.com"].map(
              (domain, i) => (
                <div
                  key={i}
                  className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-border bg-card shadow-sm"
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
          <div className="flex items-center border-l border-border/50 pl-2 pr-1 text-[9px] font-medium tracking-[0.15em] capitalize">
            <span className="opacity-40">Đối tác: </span>
            <span className="ml-1 font-bold">Hàng đầu</span>
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-9xl font-light tracking-tighter leading-[0.85] text-center w-full max-w-7xl flex flex-col group cursor-default">
          <span className="block text-foreground pr-[5%] origin-left transition-transform duration-700 group-hover:-translate-y-1">
            {firstHalf}
          </span>
          <span className="block italic text-muted-foreground/60 pl-[5%] origin-right transition-transform duration-700 group-hover:translate-y-1">
            {secondHalf}
          </span>
        </h1>

        {/* Centered Subtitle & Buttons */}
        <div className="mt-12 flex flex-col items-center text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <p className="text-sm md:text-base text-muted-foreground/80 leading-relaxed font-light text-center">
            {displaySubtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="group relative h-12 lg:h-14 rounded-full bg-primary px-8 text-sm font-medium tracking-wide text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
            >
              <Link href={displayCtaUrl}>
                <span className="relative z-10">{displayCtaText}</span>
                <div className="absolute inset-0 bg-primary-foreground/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 lg:h-14 rounded-full border-border/50 px-6 font-medium text-foreground hover:bg-muted transition-colors shadow-none"
            >
              <Link href="/san-pham">Bộ sưu tập</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
