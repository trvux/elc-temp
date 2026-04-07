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
    <section className="relative flex min-h-[96vh] w-full flex-col px-container py-section justify-between border-b border-black/5 dark:border-white/5">
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

      {/* Top row: Brand & Subtle Meta Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 max-w-7xl mx-auto w-full gap-8 animate-in fade-in slide-in-from-top-8 duration-1000">
        <div className="flex cursor-pointer items-center gap-4 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 backdrop-blur-xl transition-all hover:bg-background hover:shadow-sm">
          <div className="flex -space-x-2.5 transition-all duration-500 hover:-space-x-1">
            {["samsung.com", "sony.com", "lg.com", "panasonic.com"].map(
              (domain, i) => (
                <div
                  key={i}
                  className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border bg-white shadow-sm transition-transform duration-500"
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                    alt={domain}
                    className="h-[55%] w-[55%] object-contain"
                  />
                </div>
              ),
            )}
          </div>
          <div className="flex items-center border-l border-border/50 pl-3 pr-2 text-[10px] font-medium tracking-[0.15em] uppercase">
            <span className="opacity-40">Đối tác: </span>
            <span className="mx-1 font-bold">Hàng đầu</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            Tinh tế
          </span>
          <div className="w-1 h-1 rounded-full bg-border"></div>
          <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            Tĩnh lặng
          </span>
          <div className="w-1 h-1 rounded-full bg-border"></div>
          <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            Hoàn mỹ
          </span>
        </div>
      </div>

      {/* Center: Massive Editorial Headline */}
      <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full animate-in fade-in slide-in-from-bottom-12 duration-[1.5s]">
        <h1 className="text-huge font-light tracking-tighter leading-[0.9] text-center w-full max-w-7xl flex flex-col group cursor-default">
          <span className="block text-foreground pr-[5%] origin-left transition-transform duration-700 group-hover:-translate-y-1">
            {firstHalf}
          </span>
          <span className="block italic text-muted-foreground/60 pl-[5%] origin-right transition-transform duration-700 group-hover:translate-y-1">
            {secondHalf}
          </span>
        </h1>
      </div>

      {/* Bottom row: Subtitle, CTA & Scroll indicator */}
      <div className="flex flex-col lg:flex-row justify-between items-end relative z-10 max-w-7xl mx-auto w-full gap-12 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
        <div className="max-w-md">
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground block mb-6 px-1 lg:hidden">
            Giới thiệu
          </span>
          <p className="text-base-fluid text-muted-foreground leading-relaxed font-light text-justify md:text-left">
            {displaySubtitle}
          </p>
          <div className="mt-8 flex gap-4">
            <Button
              asChild
              size="lg"
              className="group relative h-12 lg:h-14 rounded-full bg-primary px-8 text-sm font-medium tracking-wide text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
            >
              <Link href={displayCtaUrl}>
                <span className="relative z-10">{displayCtaText}</span>
                <div className="absolute inset-0 bg-white/20 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
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

        {/* Scroll Indicator */}
        <div className="hidden lg:flex flex-col items-center gap-4 text-muted-foreground">
          <span className="text-[9px] uppercase tracking-[0.3em] font-medium rotate-90 origin-right translate-x-3 -translate-y-2">
            CUỘN XUỐNG
          </span>
          <div className="h-20 w-[1px] bg-border relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-foreground animate-[bounce_2s_infinite]" />
          </div>
        </div>
      </div>
    </section>
  );
}
