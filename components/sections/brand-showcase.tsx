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
  const BlurText = cn(
    "absolute inset-y-0 w-32 bg-linear-to-r from-cream to-transparent z-10 pointer-events-none",
  );

  return (
    <section className="">
      <div className="grid grid-cols-1 gap-20">
        <AnimateIn className="flex flex-col items-center text-center">
          <TypographyH2 className="">
            Hơn 10,000+ dự án cao cấp <br /> tin dùng giải pháp từ ELC
          </TypographyH2>
        </AnimateIn>

        <div className="relative w-full max-w-screen-xl mx-auto overflow-hidden pause-marquee">
          <div className="flex gap-10 lg:gap-20 animate-marquee w-fit">
            {/* Render 2 lần để tạo vòng lặp vô tận mượt mà */}
            {[...brands, ...brands].map((brand, i) => (
              <TypographyH3
                key={`${brand.name}-${i}`}
                className="flex items-center justify-center text-foreground/40 hover:text-foreground/80 transition-colors duration-500 cursor-grab "
              >
                {brand.name}
              </TypographyH3>
            ))}
          </div>
          {/* Hiệu ứng mờ ở 2 đầu */}
          <div className={cn(BlurText, "left-0 bg-linear-to-r")} />
          <div className={cn(BlurText, "right-0 bg-linear-to-l")} />
        </div>
      </div>
    </section>
  );
}
