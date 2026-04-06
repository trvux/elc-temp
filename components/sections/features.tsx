import React from "react";

const features = [
  {
    title: "Tư vấn & Thiết kế",
    description: "Giải pháp không khí được may đo riêng cho từng kiến trúc cao cấp và biệt thự.",
    icon: (
      <div className="h-6 w-6 rounded-md bg-foreground/10 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-primary" />
      </div>
    ),
  },
  {
    title: "Cung cấp Thiết bị",
    description: "Đối tác chiến lược của Samsung, Sony, Panasonic, LG - cam kết thiết bị chính hãng.",
    icon: (
      <div className="h-6 w-6 rounded-md bg-foreground/10 flex items-center justify-center">
        <div className="h-3 w-1 rounded-full bg-primary" />
      </div>
    ),
  },
  {
    title: "Thi công Trọn gói",
    description: "Đội ngũ kỹ thuật chuyên nghiệp, đảm bảo thẩm mỹ và hiệu suất vận hành tối ưu.",
    icon: (
      <div className="h-6 w-6 rounded-md bg-foreground/10 flex items-center justify-center">
        <div className="h-1 w-3 rounded-full bg-primary" />
      </div>
    ),
  },
];

export function FeaturesSection() {
  return (
    <section className="w-full max-w-7xl py-section px-container mx-auto">
      <div className="mb-16 max-w-2xl">
        <h2 className="text-title font-bold tracking-tight mb-6">
          Dịch vụ Chuyên biệt cho <br /> 
          <span className="text-muted-foreground/40">Không gian Thượng lưu.</span>
        </h2>
        <p className="text-base-fluid text-muted-foreground">
          Chúng tôi mang đến sự kết hợp hoàn hảo giữa công nghệ điện máy tiên tiến 
          và triết lý kiến trúc bền vững.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-fluid">
        {features.map((feature, i) => (
          <div
            key={i}
            className="group relative flex flex-col items-start p-8 rounded-4xl border border-border/40 bg-card/50 backdrop-blur-xs transition-all hover:bg-white hover:shadow-2xl hover:border-transparent dark:hover:shadow-primary/5"
          >
            <div className="mb-8 p-4 rounded-2xl bg-secondary transition-transform group-hover:scale-110">
              {feature.icon}
            </div>
            <h3 className="mb-4 text-fluid-h3 font-bold tracking-tight">
              {feature.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
            
            {/* Subtle card accent line */}
            <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-primary scale-x-0 transition-transform duration-500 origin-left group-hover:scale-x-100" />
          </div>
        ))}
      </div>
    </section>
  );
}
