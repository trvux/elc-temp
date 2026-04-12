"use client";

import Link from "next/link";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface Contact {
  id: string;
  type: string;
  label: string;
  value: string;
  order_index: number;
}

interface OrderButtonProps {
  contacts: Contact[];
}

export function OrderButton({ contacts }: OrderButtonProps) {
  const isMobile = useIsMobile();
  if (!contacts || contacts.length === 0) return null;

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

  const TriggerButton = (
    <Button
      variant="ghost"
      className="w-full border border-foreground text-lg py-5 font-bold capitalize tracking-tight rounded-none hover:bg-foreground hover:text-background transition-all duration-300 outline-none"
    >
      Tư vấn kỹ thuật
    </Button>
  );

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
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className={`${
              isDropdown ? "text-xs" : "text-sm"
            } font-bold uppercase tracking-wider truncate text-foreground/90`}
          >
            {contact.label || contact.type}
          </span>
          <span
            className={`${
              isDropdown ? "text-xs" : "text-xs"
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

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button asChild size="lg" className="w-full sm:w-auto px-10 h-12">
            {TriggerButton}
          </Button>
        </DrawerTrigger>
        <DrawerContent className="px-4 pb-12 bg-cream">
          <DrawerHeader className="px-0 pt-8 pb-4">
            <DrawerTitle className="text-left text-sm font-bold text-primary">
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
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button asChild size="lg" className="h-12">
          {TriggerButton}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        side="bottom"
        className="w-[var(--radix-dropdown-menu-trigger-width)] p-2 bg-cream"
      >
        <DropdownMenuLabel className="text-sm font-bold text-primary">
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
  );
}
