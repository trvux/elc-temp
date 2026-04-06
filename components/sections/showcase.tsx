import React from "react";
import Image from "next/image";

export function ShowcaseSection() {
  return (
    <section className="relative w-full py-section overflow-hidden">
      <div className="px-container max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <h2 className="text-title font-bold tracking-tight mb-8 leading-[1.1]">
              Công trình <br />
              <span className="text-muted-foreground/30">Nghệ thuật & Kỹ thuật.</span>
            </h2>
            <p className="text-base-fluid text-muted-foreground mb-12 max-w-lg leading-relaxed">
              Dự án Penthouse tại Quận 1 - nơi hệ thống điều hòa Stealth của ELC được tích hợp vô hình 
              vào trần cao, duy trì luồng khí tươi mát 24/7 mà không ảnh hưởng đến thiết kế nội thất.
            </p>
            
            <div className="space-y-8">
              {[
                { label: "Dự án", value: "Penthouse Horizon" },
                { label: "Giải pháp", value: "Multi-V Stealth & Fresh Air" },
                { label: "Diện tích", value: "450 m2" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-px w-8 bg-primary" />
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 block mb-1">
                      {stat.label}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-wider">
                      {stat.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-square md:aspect-video lg:aspect-[4/5] rounded-4xl overflow-hidden shadow-2xl group">
            <Image
              src="/images/showcase-1.png"
              alt="Penthouse showcase"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col justify-end p-12">
              <span className="text-white/60 text-xs uppercase tracking-widest mb-2">Showcase 01</span>
              <h3 className="text-white text-2xl font-bold">Horizon Residence</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative large text behind */}
      <div className="absolute -bottom-10 -left-10 text-[20vw] font-black text-black/5 pointer-events-none select-none tracking-tighter">
        ELC_SHOWCASE
      </div>
    </section>
  );
}
