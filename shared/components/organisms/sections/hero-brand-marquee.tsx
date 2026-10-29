import { Brand } from "@/modules/brand/domain";
import { cn } from "@/shared/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface HeroBrandMarqueeProps {
  brands: Brand[];
  caption?: string;
  className?: string;
}

// Muted, heading-less brand-logo marquee meant to sit low inside the hero
// itself — ported from the Dream Motion Framer template's tool-logo row,
// which layers its logo strip directly over the hero photo instead of as
// its own section below it. `brightness-0 invert` turns each logo into a
// flat white silhouette (the light-background grayscale treatment used
// elsewhere on the site would just disappear against this always-dark
// hero), revealing full color on hover.
export function HeroBrandMarquee({ brands, caption, className }: HeroBrandMarqueeProps) {
  if (brands.length === 0) return null;

  return (
    <div className={cn("w-full", className)}>
      {caption && (
        <p id="brand-marquee-caption" className="mb-3 text-center type-body-sm text-white/50">{caption}</p>
      )}
      <div
        className={cn(
          "relative mx-auto w-full max-w-screen-xl overflow-hidden",
          "hover:pause-marquee focus-within:pause-marquee mask-[linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]",
        )}
      >
        <ul
          aria-labelledby={caption ? "brand-marquee-caption" : undefined}
          className="flex w-fit items-center gap-8 py-2 animate-marquee motion-reduce:animate-none md:gap-16 lg:gap-20"
        >
          {/* Rendered twice for a seamless loop. The second pass is a visual
              duplicate only: hidden from assistive tech and out of the Tab
              order, so every brand is announced and focusable once. */}
          {[...brands, ...brands].map((brand, i) => {
            const url = `/san-pham?brands=${brand.slug}`;
            const isDuplicate = i >= brands.length;
            return (
              <li key={`${brand.id}-${i}`} aria-hidden={isDuplicate || undefined}>
                <Link
                  href={url}
                  prefetch={false}
                  tabIndex={isDuplicate ? -1 : undefined}
                  className="group flex h-10 shrink-0 select-none items-center justify-center px-6 transition-all duration-300 md:h-12"
                  title={`Xem sản phẩm từ thương hiệu ${brand.name}`}
                >
                  {brand.logoUrl ? (
                    <div className="relative h-7 w-20 md:h-8 md:w-24">
                      <Image
                        src={brand.logoUrl}
                        alt={brand.name}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 80px, 96px"
                        className="object-contain opacity-60 grayscale invert brightness-0 transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-hover:invert-0 group-hover:brightness-100"
                      />
                    </div>
                  ) : (
                    <span className="type-label text-white/50 transition-colors duration-300 group-hover:text-white">
                      {brand.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
