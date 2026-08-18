"use client";

import {
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  TypographyH2,
  TypographyLarge,
  TypographyMuted,
  TypographyP,
} from "@/shared/components/ui/typography";
import Link from "next/link";
import { useMemo } from "react";

import { Contact, getDisplayContacts } from "@/modules/contact/domain";

interface CTASectionProps {
  settings?: Record<string, string>;
  contacts: Contact[];
}

export function CTASection({ settings, contacts }: CTASectionProps) {
  const phoneContact =
    contacts.find((c) => c.type === "phone" && c.isActive) ||
    contacts.find((c) => c.type === "phone");
  const phone = phoneContact?.value || "0789978898";
  const phoneHref = phoneContact?.href || `tel:${phone.replace(/\s+/g, "")}`;
  const title = settings?.cta_title || "Nâng tầm chuẩn mực không gian.";
  const description =
    settings?.cta_description ||
    "Đội ngũ chuyên gia của ELC sẵn sàng đồng hành tư vấn giải pháp điều hòa, hệ thống cấp khí tươi thu hồi nhiệt và lọc không khí kết hợp Smart home tối ưu, phù hợp với đặc tính của từng không gian kiến trúc.";

  const displayContacts = useMemo(
    () => getDisplayContacts(contacts),
    [contacts],
  );

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6">
      <StaggerContainer
        className="flex flex-col items-center text-center max-w-3xl mx-auto gap-10 md:gap-12 w-full"
        immediate
      >
        <div className="space-y-4">
          <StaggerItem>
            <TypographyH2>{title}</TypographyH2>
          </StaggerItem>
          <StaggerItem>
            <TypographyP className="text-muted-foreground max-w-2xl mx-auto">
              {description}
            </TypographyP>
          </StaggerItem>
        </div>

        <StaggerItem>
          {(() => {
            const zaloContact =
              contacts.find((c) => c.type === "zalo" && c.isActive) ||
              contacts.find((c) => c.type === "zalo") ||
              displayContacts[0];
            return zaloContact ? (
              <Button
                variant="default"
                size="lg"
                className="shadow-[0_0.84px_0.84px_-0.31px_rgba(36,36,36,0.15),0_1.99px_1.99px_-0.625px_rgba(36,36,36,0.15),0_3.63px_3.63px_-0.9375px_rgba(36,36,36,0.15),0_6.04px_6.04px_-1.25px_rgba(36,36,36,0.15),0_9.75px_9.75px_-1.56px_rgba(36,36,36,0.15),0_15.96px_15.96px_-1.875px_rgba(36,36,36,0.15),0_27.48px_27.48px_-2.19px_rgba(36,36,36,0.15),0_50px_50px_-2.5px_rgba(36,36,36,0.15)] border-none"
                asChild
              >
                <a
                  href={zaloContact.href}
                  target={zaloContact.isExternal ? "_blank" : undefined}
                  rel={
                    zaloContact.isExternal ? "noopener noreferrer" : undefined
                  }
                >
                  {settings?.cta_primary_btn_text || "Tư vấn lắp đặt miễn phí"}
                </a>
              </Button>
            ) : null;
          })()}
        </StaggerItem>

        <StaggerItem className="w-full flex justify-center">
          <Separator className="max-w-xs opacity-50" />
        </StaggerItem>

        <StaggerItem>
          <div className="flex flex-col items-center gap-3">
            <TypographyMuted>
              Hoặc kết nối trực tiếp qua hotline
            </TypographyMuted>
            <Link
              href={phoneHref}
              className="hover:opacity-80 transition-opacity"
            >
              <TypographyLarge>{phone}</TypographyLarge>
            </Link>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
