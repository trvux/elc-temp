import {
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import { Card } from "@/shared/components/ui/card";
import { TypographyH1 } from "@/shared/components/ui/typography";
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
    section:
      "dark w-full bg-card text-card-foreground py-16 px-4 md:px-8 flex flex-col items-center justify-center gap-6",

    container: "grid grid-cols-1 gap-12 w-full",
    header: "flex flex-col items-center text-center px-6",
    marqueeArea:
      "relative w-full max-w-screen-xl mx-auto overflow-hidden pause-marquee",
    marqueeTrack: "flex gap-6 md:gap-16 lg:gap-24 animate-marquee w-fit",
    brand:
      "flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors duration-500 cursor-grab whitespace-nowrap text-sm font-medium tracking-tight sm:text-lg md:text-xl lg:text-2xl",
  };

  return (
    <Card className={styles.section}>
      <StaggerContainer className={styles.container}>
        <StaggerItem className={styles.header}>
          <TypographyH1>
            Thương hiệu đồng hành cùng <br className="hidden md:block" /> Điện
            máy ELC
          </TypographyH1>
        </StaggerItem>

        <StaggerItem>
          <div
            className={cn(
              styles.marqueeArea,
              "mask-[linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]",
            )}
          >
            <div className={styles.marqueeTrack}>
              {/* Render 2 times for seamless loop */}
              {[...brands, ...brands].map((brand, i) => (
                <span key={`${brand.name}-${i}`} className={styles.brand}>
                  {brand.name}
                </span>
              ))}
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </Card>
  );
}
