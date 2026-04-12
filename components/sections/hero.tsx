"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { getOptimizedImage } from "@/lib/image";
import { useIsMobile } from "@/hooks/use-mobile";
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

interface Contact {
  id: string;
  type: string;
  label: string;
  value: string;
  order_index: number;
}

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  image?: string;
  contacts?: Contact[];
}

export function HeroSection({
  title,
  subtitle,
  ctaText,
  ctaUrl,
  image,
  contacts = [],
}: HeroSectionProps) {
  const isMobile = useIsMobile();
  const [currentContactIndex, setCurrentContactIndex] = useState(0);

  useEffect(() => {
    if (contacts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentContactIndex((prev) => (prev + 1) % contacts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [contacts]);

  const displayTitle = title || "Giải pháp Không khí thuần khiết.";
  const displaySubtitle =
    subtitle ||
    "Xóa bỏ ranh giới giữa bên trong và thiên nhiên. Hệ thống điều khí thông minh từ ELC tự động tối ưu từng nhịp thở cho ngôi nhà của bạn.";
  const displayCtaText = ctaText || "Bắt đầu ngay";
  const displayCtaUrl = ctaUrl || "/cong-trinh";
  const displayImage = image || "/img-herosection.jpg";

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
    const Icon = getContactIcon(contact.type) as React.ComponentType<{
      size?: number;
      className?: string;
    }>;
    const href = getContactHref(contact.type, contact.value);
    const isProtocol = contact.type === "phone" || contact.type === "email";

    const content = (
      <>
        <Icon
          size={20}
          className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
        />
        <div className="flex flex-col gap-0.5 min-w-0 text-left">
          <span className="text-sm font-medium truncate">
            {contact.label || contact.type}
          </span>
          <span className="text-xs text-muted-foreground truncate">
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

  const currentContact = contacts[currentContactIndex];
  const ContactIcon = (
    currentContact ? getContactIcon(currentContact.type) : LinkIcon
  ) as React.ComponentType<{ size?: number; className?: string }>;

  const secondaryButtonContent = currentContact ? (
    <Button
      asChild
      variant="outline"
      size="lg"
      className="w-full h-12 text-base font-semibold group flex items-center overflow-hidden relative border-foreground/20 hover:border-foreground/40 bg-transparent transition-all duration-300 md:col-span-3"
    >
      <a
        href={getContactHref(currentContact.type, currentContact.value)}
        target={
          currentContact.type === "phone" || currentContact.type === "email"
            ? undefined
            : "_blank"
        }
        rel="noopener noreferrer"
      >
        <div className="grid grid-cols-10 items-center animate-in fade-in slide-in-from-bottom-2 duration-500 w-full h-full">
          {/* Icon Container - 30% */}
          <div className="col-span-2 flex justify-center items-center border-r border-foreground/5 h-full ">
            <ContactIcon
              size={18}
              className="text-primary transition-colors drop-shadow-sm"
            />
          </div>

          {/* Text Content - 70% */}
          <div className="col-span-8 flex flex-col items-center md:items-start md:pl-4 leading-tight">
            <span className="text-xs font-bold text-primary/60 normal-case mb-0.5 scale-90 origin-center md:origin-left text-center md:text-left">
              {currentContact.label || currentContact.type}
            </span>
            <span className="text-sm font-bold truncate w-full text-foreground tracking-tight text-center md:text-left">
              {currentContact.value}
            </span>
          </div>
        </div>
      </a>
    </Button>
  ) : (
    <Button
      variant="outline"
      size="lg"
      className="w-full h-12 text-base font-semibold md:col-span-3"
    >
      Liên hệ hỗ trợ
    </Button>
  );

  return (
    <section className="pt-36 max-w-screen-2xl lg:mx-auto ">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center justify-between">
        {/* Cột trái */}
        <div className="flex flex-col gap-8">
          <h1 className="font-newsreader text-4xl sm:text-6xl lg:text-7xl leading-tight tracking-tighter">
            {displayTitle}
          </h1>

          <Separator />

          <p className="text-base xl:text-lg text-foreground leading-relaxed">
            {displaySubtitle}
          </p>

          {/* Button Layout Group */}
          <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
            {/* Button Chính */}
            <Button
              asChild
              size="lg"
              className="w-full h-12 text-base font-semibold md:col-span-7"
            >
              <Link href={displayCtaUrl}>{displayCtaText}</Link>
            </Button>

            {/* Button Phụ (Direct Link + Cycling) */}
            {secondaryButtonContent}
          </div>
        </div>

        {/* Cột phải */}
        <div className="relative aspect-square w-full">
          <Image
            src={getOptimizedImage(displayImage)}
            alt="ELC không gian sống"
            fill
            priority
            fetchPriority="high"
            className="object-cover rounded-2xl"
            sizes="(max-width: 1280px) 100vw, 800px"
          />
        </div>
      </div>
    </section>
  );
}
