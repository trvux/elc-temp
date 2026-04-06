import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-start overflow-hidden px-container pt-[18vh] pb-section text-center bg-[#FAF7F2]">
      {/* Subtle background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/50 to-transparent"></div>

      <div className="flex flex-col items-center">
        {/* Brand Badge - Partnering with top electronics brands */}
        <div className="mb-[3vh] flex cursor-pointer items-center gap-2 rounded-full border border-border/40 bg-background px-1.5 py-1 backdrop-blur-xl transition-all hover:bg-background/80 hover:shadow-xs">
          <div className="flex -space-x-4 transition-all duration-500 hover:-space-x-2.5 hover:px-1">
            {["samsung.com", "sony.com", "lg.com", "panasonic.com"].map(
              (domain, i) => (
                <div
                  key={i}
                  className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-background bg-white ring-1 ring-border/10 transition-transform duration-500"
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                    alt={domain}
                    className="h-[70%] w-[70%] object-contain"
                  />
                </div>
              ),
            )}
          </div>
          <div className="flex items-center border-l border-border/40 pl-2 pr-1.5 text-[11px] font-medium tracking-tight">
            <span className="text-muted-foreground/80 lowercase">Cùng các</span>
            <span className="mx-1 font-bold text-foreground">Đối tác</span>
            <span className="text-muted-foreground/80 whitespace-nowrap lowercase">
              điện máy hàng đầu
            </span>
          </div>
        </div>

        {/* Hero Heading - Using Massive Fluid Typography */}
        <div className="max-w-7xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <h1 className="text-huge font-extrabold tracking-tighter leading-[0.95] text-center">
            <span className="block text-foreground mb-4">Giải pháp</span>
            <span className="block text-muted-foreground/30">
              Không khí thuần khiết.
            </span>
          </h1>
        </div>

        {/* Hero Subtitle - Fluid Scaling */}
        <p className="mt-[4vh] max-w-2xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 text-base-fluid text-foreground/70 leading-relaxed font-medium">
          Xóa bỏ ranh giới giữa bên trong và thiên nhiên. Hệ thống điều khí
          thông minh từ ELC tự động tối ưu từng nhịp thở cho ngôi nhà của bạn.
        </p>

        {/* CTA Button - Scaled down for refinement */}
        <div className="mt-[4vh] animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <Button
            size="lg"
            className="bg-black px-6 py-4 text-sm font-semibold text-white shadow-xl transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-black"
          >
            Bắt đầu ngay
          </Button>
        </div>
      </div>
    </section>
  );
}
