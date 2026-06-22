"use client";

import {
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Separator } from "@/shared/components/ui/separator";
import {
  TypographyH1,
  TypographyLarge,
  TypographyMuted,
  TypographyP,
} from "@/shared/components/ui/typography";
import Link from "next/link";
import { useMemo } from "react";

import { Contact, getDisplayContacts } from "@/modules/contact/domain";
import { ContactLink } from "@/modules/contact/presentation/components/ContactLink";

interface CTASectionProps {
  settings?: Record<string, string>;
  contacts: Contact[];
}

export function CTASection({ settings, contacts }: CTASectionProps) {
  const emailContact = contacts.find((c) => c.type === "email" && c.isActive);
  const email = emailContact?.value || "elc.jointstock@gmail.com";
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
            <TypographyH1>{title}</TypographyH1>
          </StaggerItem>
          <StaggerItem>
            <TypographyP className="text-muted-foreground max-w-2xl mx-auto">
              {description}
            </TypographyP>
          </StaggerItem>
        </div>

        <StaggerItem>
          {displayContacts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="lg">
                  {settings?.cta_primary_btn_text || "Tư vấn lắp đặt miễn phí"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-120">
                <DropdownMenuLabel>Phương thức liên hệ</DropdownMenuLabel>
                {displayContacts.map((contact) => (
                  <DropdownMenuItem key={contact.id}>
                    <ContactLink
                      contact={contact}
                      iconProps={{ size: 20, weight: "regular" }}
                      showValue
                      className="w-full"
                    />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </StaggerItem>

        <StaggerItem className="w-full flex justify-center">
          <Separator className="max-w-xs opacity-50" />
        </StaggerItem>

        <StaggerItem>
          <div className="flex flex-col items-center gap-3">
            <TypographyMuted>Hoặc kết nối trực tiếp qua email</TypographyMuted>
            <Link
              href={`mailto:${email}`}
              className="hover:opacity-80 transition-opacity"
            >
              <TypographyLarge className="italic text-2xl">
                {email}
              </TypographyLarge>
            </Link>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
