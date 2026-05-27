import {
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import { Card } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import {
  TypographyH1,
  TypographyLead,
} from "@/shared/components/ui/typography";

import { Contact } from "@/modules/contact/domain";
import { HeroContactActions } from "./hero-contact-actions";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  contacts?: Contact[];
}

export function HeroSection({
  title = "Giải pháp Không khí thuần khiết.",
  subtitle = "Xóa bỏ ranh giới giữa bên trong và thiên nhiên. Hệ thống điều khí thông minh từ ELC tự động tối ưu từng nhịp thở cho ngôi nhà của bạn.",
  contacts = [],
}: HeroSectionProps) {
  return (
    <Card className="dark w-full bg-card text-card-foreground py-16 px-4 md:px-8 flex flex-col items-center justify-center gap-6">
      {/* Cụm Content */}
      <StaggerContainer
        className="flex flex-col gap-4 items-center justify-center text-center max-w-4xl w-full"
        staggerDelay={0.08}
      >
        <StaggerItem duration={0.25}>
          <TypographyH1 className="text-3xl md:text-5xl lg:text-6xl">
            {title}
          </TypographyH1>
        </StaggerItem>
        <StaggerItem duration={0.25}>
          <Separator className="w-24" />
        </StaggerItem>
        <StaggerItem duration={0.25}>
          {/* <TypographyLead>{subtitle}</TypographyLead> */}
          <TypographyLead>
            ELC chuyên cung cấp, thi công lắp đặt và trao đổi trọn gói các dòng
            máy lạnh, hệ thống lọc khí tươi thông minh cho cá nhân và doanh
            nghiệp từ những thương hiệu uy tín hàng đầu.
          </TypographyLead>
        </StaggerItem>

        <HeroContactActions contacts={contacts} />
      </StaggerContainer>
    </Card>
  );
}
