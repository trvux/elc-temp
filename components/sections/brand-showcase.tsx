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
  return (
    <section className="max-w-screen-2xl lg:mx-auto overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-8 lg:mb-16 max-w-screen-xl mx-auto">
          <h2 className="font-newsreader text-3xl md:text-4xl lg:text-5xl text-foreground/80 leading-tight tracking-tighter">
            Hơn 10,000+ dự án cao cấp <br /> tin dùng giải pháp từ ELC
          </h2>
        </div>

        <div className="relative w-full max-w-screen-xl mx-auto overflow-hidden pause-marquee">
          <div className="flex gap-10 lg:gap-20 animate-marquee w-fit">
            {/* Render 2 lần để tạo vòng lặp vô tận mượt mà */}
            {[...brands, ...brands].map((brand, i) => (
              <span
                key={`${brand.name}-${i}`}
                className="flex-shrink-0 flex items-center justify-center text-2xl md:text-3xl lg:text-4xl font-newsreader text-foreground/40 hover:text-foreground/80 transition-colors duration-500 cursor-default uppercase tracking-[0.2em]"
              >
                {brand.name}
              </span>
            ))}
          </div>

          {/* Hiệu ứng mờ ở 2 đầu */}
          <div className="absolute inset-y-0 left-0 w-32 bg-linear-to-r from-cream to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-linear-to-l from-cream to-transparent z-10 pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
