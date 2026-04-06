import Link from "next/link";
import {
  Building2,
  Phone,
  MessageSquare,
  MapPin,
  ExternalLink,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-[#FAF7F2] border-t border-border/20 px-0">
      <div className="mx-auto max-w-7xl flex flex-col lg:flex-row items-stretch">
        {/* Left Side (2/3) */}
        <div className="lg:basis-2/3 flex flex-col md:flex-row gap-fluid py-section px-container">
          <div className="flex flex-col gap-6 basis-1/3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-3xl font-bold italic tracking-tighter text-primary">
                ELC
              </span>
            </Link>
            <p className="text-base-fluid text-foreground/60 leading-relaxed">
              Kiến tạo không gian thuần khiết qua hệ thống điều tiết không khí
              thông minh và bền vững.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 basis-2/3">
            <div className="flex flex-col gap-5">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/40">
                Công ty
              </h4>
              <nav className="flex flex-col gap-3">
                {["Về ELC", "Tin tức", "Tuyển dụng"].map((item) => (
                  <Link
                    key={item}
                    href="#"
                    className="text-sm text-foreground/70 hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex flex-col gap-5">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/40">
                Dự án
              </h4>
              <nav className="flex flex-col gap-3">
                {["Căn hộ", "Biệt thự", "Văn phòng"].map((item) => (
                  <Link
                    key={item}
                    href="#"
                    className="text-sm text-foreground/70 hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex flex-col gap-5">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/40">
                Sản phẩm
              </h4>
              <nav className="flex flex-col gap-3">
                {["Điều khí", "Lọc bụi", "Cảm biến"].map((item) => (
                  <Link
                    key={item}
                    href="#"
                    className="text-sm text-foreground/70 hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Right Side (1/3) - Simple Grid Contact Section - Full Height */}
        <div className="lg:basis-1/3 flex flex-col border-l border-r lg:border-r-0 border-b lg:border-b-0 border-border">
          {[
            { icon: Building2, text: "Điện máy ELC" },
            { icon: Phone, text: "Hotline: 0123 456 789" },
            {
              domain: "zalo.me",
              text: "Zalo: 0123 456 789",
            },
            {
              domain: "messenger.com",
              text: "Messenger của ELC",
            },
            { icon: MapPin, text: "06 Đường Phan Chu Trinh, Q.7, HCM" },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex flex-1 border-border ${i !== 0 ? "border-t" : ""}`}
            >
              <div className="w-16 min-w-[64px] flex items-center justify-center text-foreground/50">
                {"domain" in item ? (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`}
                    alt={item.domain}
                    className="h-5 w-5 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                  />
                ) : (
                  <item.icon size={20} className="stroke-[1.5]" />
                )}
              </div>
              <div className="flex items-center pr-6 py-4">
                <span className="text-sm font-semibold text-foreground tracking-tight leading-snug">
                  {item.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/20 w-full bg-white/20">
        <div className="mx-auto max-w-7xl py-10 px-container flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[11px] text-foreground/30">
            © {new Date().getFullYear()} ELC Intelligence. Toàn bộ bản quyền
            được bảo lưu.
          </p>
          <div className="flex items-center gap-8 text-[11px] text-foreground/80 uppercase tracking-widest font-semibold">
            <Link href="#" className="hover:text-primary transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Điều khoản dịch vụ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
