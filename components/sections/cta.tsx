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
          className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
        />
        <div className="flex flex-col gap-0.5 min-w-0 text-left">
          <span
            className={`${isDropdown ? "text-xs" : "text-sm"} font-medium truncate`}
          >
            {contact.label || contact.type}
          </span>
          <span
            className={`${isDropdown ? "text-[10px]" : "text-xs"} text-muted-foreground truncate`}
          >
            {contact.value}
          </span>
        </div>
      </>
    );

    const className = isDropdown
      ? "flex items-center gap-3 cursor-pointer px-3 py-2.5 w-full group"
      : "flex items-center gap-4 cursor-pointer px-3 py-3.5 w-full hover:bg-muted/50 rounded-lg transition-colors group";

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

  return (
    <section className="">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-8">
          {/* Title */}
          <h2 className="font-newsreader text-4xl md:text-5xl lg:text-6xl leading-tight italic">
            {title}
          </h2>

          {/* Description */}
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>

          {/* Button */}
          {isMobile ? (
            <Drawer>
              <DrawerTrigger asChild>
                <Button size="lg" className="w-full sm:w-auto px-10 h-12">
                  {primaryBtnText}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="px-4 pb-12">
                <DrawerHeader className="px-0 pt-8 pb-4">
                  <DrawerTitle className="text-left text-sm font-semibold">
                    Kênh liên hệ hỗ trợ
                  </DrawerTitle>
                  <DrawerDescription className="text-left text-xs">
                    Vui lòng chọn kênh liên hệ để chúng tôi hỗ trợ bạn tốt nhất.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="flex flex-col gap-1">
                  {contacts.map((contact) => renderContactItem(contact))}
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" className="px-10 h-12">
                  {primaryBtnText}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                side="bottom"
                className="w-64 p-2"
              >
                <DropdownMenuLabel className="text-xs font-bold tracking-wide px-3 py-2">
                  Kênh liên hệ hỗ trợ
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {contacts.map((contact) => (
                  <DropdownMenuItem key={contact.id} asChild className="p-0">
                    {renderContactItem(contact, true)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Separator className="max-w-xs opacity-20" />

          {/* Email */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
              Hoặc kết nối qua email
            </p>
            <a
              href={`mailto:${email}`}
              className="text-base md:text-lg font-medium hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              {email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
