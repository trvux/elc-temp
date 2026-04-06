import React from "react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="w-full max-w-7xl px-container mx-auto py-section">
      <div className="relative p-12 md:p-24 bg-black dark:bg-white rounded-[3rem] overflow-hidden group shadow-2xl">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[40rem] h-[40rem] bg-primary/20 blur-[100px] rounded-full transition-transform duration-1000 group-hover:scale-110 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary mb-6">
            LIÊN HỆ VỚI CHÚNG TÔI
          </span>
          <h2 className="text-title text-white dark:text-black font-bold tracking-tight mb-8 leading-[1.1]">
            Nâng tầm không gian <br /> 
            sống của bạn ngay hôm nay.
          </h2>
          <p className="text-white/60 dark:text-black/60 max-w-xl text-base-fluid mb-12">
            Đội ngũ chuyên gia của ELC sẵn sàng tư vấn giải pháp không khí tối ưu nhất 
            phù hợp với không gian kiến trúc của bạn.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-white text-black dark:bg-black dark:text-white px-8 py-6 rounded-full font-bold hover:scale-105 active:scale-95 transition-all">
              Nhận tư vấn miễn phí
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white dark:border-black/20 dark:text-black px-8 py-6 rounded-full font-bold hover:bg-white/10 dark:hover:bg-black/5 transition-all">
              Xem bảng giá dịch vụ
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
