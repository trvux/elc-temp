import { AnimateIn } from "@/shared/components/ui/animate-in";
import { TypographyH2, TypographyH3 } from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";

const brands = [
  { name: "Carrier", domain: "carrier.com" },
  { name: "Daikin", domain: "daikin.com.vn" },
  { name: "Gree", domain: "gree.com.vn" },
  { name: "LG", domain: "lg.com" },
  { name: "Menred", domain: "menred.com" },
  { name: "Midea", domain: "midea.com" },
  { name: "Mitsubishi", domain: "mitsubishi-electric.vn" },
  { name: "Panasonic", domain: "panasonic.com" },
  { name: "Samsung", domain: "samsung.com" },
  { name: "Toshiba", domain: "toshiba-lifestyle.com" },
];

export function BrandShowcase() {
  const styles = {
    section: "",

    container: "grid grid-cols-1 gap-4 md:gap-20",
    header: "flex flex-col items-center text-center px-6",
    marqueeArea:
      "relative w-full max-w-screen-xl mx-auto overflow-hidden pause-marquee",
    marqueeTrack: "flex gap-6 md:gap-16 lg:gap-24 animate-marquee w-fit",
    brand:
      "flex items-center justify-center text-foreground/30 hover:text-foreground/80 transition-colors duration-500 cursor-grab whitespace-nowrap text-sm font-medium tracking-tight sm:text-lg md:text-xl lg:text-2xl",
    gradient: "absolute inset-y-0 w-8 md:w-32 lg:w-40 z-10 pointer-events-none",
    gradientLeft: "left-0 bg-linear-to-r from-background to-transparent",
    gradientRight: "right-0 bg-linear-to-l from-background to-transparent",
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <AnimateIn className={styles.header}>
          <TypographyH2>
            Hơn 10,000+ dự án cao cấp <br className="hidden md:block" /> tin dùng giải pháp từ ELC
          </TypographyH2>
        </AnimateIn>

        <AnimateIn delay={0.2}>
          <div className={styles.marqueeArea}>
            <div className={styles.marqueeTrack}>
              {/* Render 2 times for seamless loop */}
              {[...brands, ...brands].map((brand, i) => (
                <span
                  key={`${brand.name}-${i}`}
                  className={styles.brand}
                >
                  {brand.name}
                </span>
              ))}
            </div>

            {/* Edge Fading Effects */}
            <div className={cn(styles.gradient, styles.gradientLeft)} />
            <div className={cn(styles.gradient, styles.gradientRight)} />
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
