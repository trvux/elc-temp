"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  FacebookIcon,
  ZaloIcon,
  MessengerIcon,
  PhoneIcon,
  EmailIcon,
  WebsiteIcon,
  LinkIcon,
} from "@/components/social-icons";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";

interface Contact {
  id: string;
  type: string;
  label: string;
  value: string;
  order_index: number;
}

interface CTASectionProps {
  settings?: Record<string, string>;
  contacts: Contact[];
}

export function CTASection({ settings, contacts }: CTASectionProps) {
  const isMobile = useIsMobile();
  const email = settings?.company_email || "contact@elc.com";

  const title = settings?.cta_title || "Nâng tầm chuẩn mực không gian.";
  const description =
    settings?.cta_description ||
    "Đội ngũ chuyên gia của ELC sẵn sàng đồng hành tư vấn giải pháp không khí tối ưu nhất, phù hợp đặc tính từng không gian kiến trúc.";

  const primaryBtnText = settings?.cta_primary_btn_text || "Liên hệ ngay";

  const getContactIcon = (type: string) => {
    switch (type) {
      case "phone":
        return PhoneIcon;
      case "email":
        return EmailIcon;
      case "facebook":
        return FacebookIcon;
      case "messenger":
        return MessengerIcon;
      case "zalo":
        return ZaloIcon;
      case "website":
        return WebsiteIcon;
      default:
        return LinkIcon;
    }
  };

  const getContactHref = (type: string, value: string) => {
    const cleanValue = value.replace(/\s/g, "");
    if (value.startsWith("http")) return value;

    switch (type) {
      case "phone":
        return `tel:${cleanValue}`;
      case "email":
        return `mailto:${value}`;
      case "zalo":
        return `https://zalo.me/${cleanValue}`;
      case "messenger":
        return `https://m.me/${value}`;
      case "facebook":
        return `https://facebook.com/${value}`;
      default:
        return value;
    }
  };

  const renderContactItem = (contact: Contact, isDropdown = false) => {
    const Icon = getContactIcon(contact.type);
    const href = getContactHref(contact.type, contact.value);
    const isProtocol = contact.type === "phone" || contact.type === "email";

    const content = (
      <>
        <Icon
          size={isDropdown ? 18 : 22}
          className={`text-foreground/${
            isDropdown ? "60" : "70"
          } group-hover:text-primary transition-colors shrink-0`}
        />
        <div className="flex flex-col gap-0.5 min-w-0 text-left">
          <span
            className={`${
              isDropdown ? "text-[11px]" : "text-[13px]"
            } font-bold uppercase tracking-wider truncate text-foreground/90`}
          >
            {contact.label || contact.type}
          </span>
          <span
            className={`${
              isDropdown ? "text-[10px]" : "text-[12px]"
            } text-muted-foreground truncate`}
          >
            {contact.value}
          </span>
        </div>
      </>
    );

    const className = isDropdown
      ? "flex items-center gap-5 cursor-pointer px-4 py-3.5 w-full group"
      : "flex items-center gap-6 cursor-pointer px-4 py-4 w-full hover:bg-muted/50 rounded-lg transition-colors group";

    if (isProtocol) {
      return (
        <a key={contact.id} href={href} className={className}>
          {content}
        </a>
      );
    }

    return (
      <Link
        key={contact.id}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </Link>
    );
  };

  const TriggerButton = (
    <Button
      size="lg"
      className="w-full sm:w-[280px] h-14 text-base font-bold shadow-lg shadow-primary/20 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none select-none"
    >
      {primaryBtnText}
    </Button>
  );

  return (
    <section className="flex-1 flex flex-col justify-center w-full relative overflow-hidden">
      <div className="pt-24 max-w-7xl px-container py-section mx-auto w-full">
        <div className="relative py-16 sm:py-24">
          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-4 mb-10">
              <Badge
                variant="outline"
                className="text-[10px] capitalize tracking-[0.25em] font-medium px-4 py-1.5 h-auto rounded-full border-border/50 bg-background/50"
              >
                03 ━ Liên hệ
              </Badge>
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tighter mb-8 leading-[1.1] text-foreground max-w-3xl whitespace-pre-line">
              {title}
            </h2>

            <p className="text-sm md:text-base text-muted-foreground max-w-2xl font-light leading-relaxed mb-10 opacity-80">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              {isMobile ? (
                <Drawer>
                  <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
                  <DrawerContent className="px-container pb-12">
                    <DrawerHeader className="px-0 pt-8 pb-4">
                      <DrawerTitle className="text-left text-sm font-bold capitalize tracking-tight text-foreground">
                        Kênh liên hệ hỗ trợ
                      </DrawerTitle>
                      <DrawerDescription className="text-left text-[11px]">
                        Vui lòng chọn kênh liên hệ để chúng tôi hỗ trợ bạn tốt
                        nhất.
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="flex flex-col gap-1 -mx-2">
                      {contacts.map((contact) => renderContactItem(contact))}
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    {TriggerButton}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    side="bottom"
                    className="p-2 w-[280px] shadow-2xl border-border/50"
                  >
                    <DropdownMenuLabel className="px-3 py-2 text-sm font-bold capitalize tracking-tight text-foreground">
                      Kênh liên hệ hỗ trợ
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {contacts.map((contact) => (
                      <DropdownMenuItem
                        key={contact.id}
                        asChild
                        className="p-0"
                      >
                        {renderContactItem(contact, true)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <Separator className="my-12 max-w-sm opacity-20" />

            <div className="flex flex-col items-center gap-2">
              <p className="text-sm capitalize tracking-tight text-muted-foreground/60 font-bold mb-1">
                Hoặc kết nối qua email
              </p>
              <a
                href={`mailto:${email}`}
                className="text-lg font-medium text-foreground hover:text-primary transition-all underline-offset-8 decoration-primary/30 hover:underline"
              >
                {email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
