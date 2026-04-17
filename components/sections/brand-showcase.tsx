import { AnimateIn } from "@/components/ui/animate-in";
import { TypographyH2, TypographyH3 } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

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
    section: "py-20",
    container: "grid grid-cols-1 gap-16 md:gap-20",
    header: "flex flex-col items-center text-center",
    marqueeArea: "relative w-full max-w-screen-xl mx-auto overflow-hidden pause-marquee",
    marqueeTrack: "flex gap-12 lg:gap-24 animate-marquee w-fit",
    brand: "flex items-center justify-center text-foreground/40 hover:text-foreground/80 transition-colors duration-500 cursor-grab whitespace-nowrap",
    gradient: "absolute inset-y-0 w-24 md:w-40 z-10 pointer-events-none",
    gradientLeft: "left-0 bg-linear-to-r from-cream to-transparent",
    gradientRight: "right-0 bg-linear-to-l from-cream to-transparent",
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <AnimateIn className={styles.header}>
          <TypographyH2>
            Hơn 10,000+ dự án cao cấp <br /> tin dùng giải pháp từ ELC
          </TypographyH2>
        </AnimateIn>

        <AnimateIn delay={0.2}>
          <div className={styles.marqueeArea}>
            <div className={styles.marqueeTrack}>
              {/* Render 2 times for seamless loop */}
              {[...brands, ...brands].map((brand, i) => (
                <TypographyH3 key={`${brand.name}-${i}`} className={styles.brand}>
                  {brand.name}
                </TypographyH3>
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
