import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PhoneConfirmation } from "@/components/user/phone-confirmation";

interface CTASectionProps {
  settings?: Record<string, string>;
}

export function CTASection({ settings }: CTASectionProps) {
  const phone = settings?.company_phone || "0909 123 456";
  const email = settings?.company_email || "contact@elc.com";

  return (
    <section className="w-full max-w-7xl px-container py-section mx-auto relative">
      <div className="relative z-10 py-section px-container overflow-hidden group">
        
        {/* Subtle Background Pattern/Glow */}
        <div className="absolute inset-0 opacity-30 dark:opacity-50">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] aspect-square bg-white dark:bg-white/10 blur-[120px] rounded-full pointer-events-none mix-blend-overlay" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-4 mb-10">
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">
              03 ━ Liên hệ
            </span>
          </div>
          
          <h2 className="text-title font-light tracking-tighter mb-8 leading-tight text-foreground">
            Bắt đầu <br className="hidden sm:block" /> 
            <span className="italic text-muted-foreground/80">hành trình</span> kiến tạo.
          </h2>
          
          <p className="text-base-fluid text-muted-foreground max-w-xl font-light leading-relaxed mb-14">
            Đội ngũ chuyên gia của ELC sẵn sàng đồng hành tư vấn giải pháp không khí tối ưu nhất, phù hợp đặc tính từng không gian kiến trúc.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-fluid w-full">
            <PhoneConfirmation phone={phone.replace(/\s/g, '')}>
              <Button 
                asChild
                size="lg" 
                className="group relative h-16 w-full sm:w-auto bg-primary text-primary-foreground px-12 rounded-full font-medium tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
              >
                <span>Gọi ngay: {phone}
                  <div className="absolute inset-0 bg-white/20 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </span>
              </Button>
            </PhoneConfirmation>
            
            <Button 
              asChild
              size="lg" 
              variant="outline" 
              className="h-16 w-full sm:w-auto border-border text-foreground px-12 rounded-full font-medium tracking-wide hover:bg-muted transition-colors shadow-none bg-transparent backdrop-blur-md"
            >
              <Link href="/thong-tin?slug=contact-us">
                Yêu cầu tư vấn
              </Link>
            </Button>
          </div>
          
          {/* Email subtly underneath */}
          <div className="mt-14 inline-block text-[11px] uppercase tracking-widest text-muted-foreground font-medium translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100">
            hoặc email <a href={`mailto:${email}`} className="text-foreground hover:underline transition-all underline-offset-4 decoration-border lowercase">{email}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
