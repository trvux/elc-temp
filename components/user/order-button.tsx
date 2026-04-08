"use client";

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
      className="w-full border border-foreground text-sm font-bold capitalize tracking-tight rounded-none hover:bg-foreground hover:text-background transition-all duration-300 outline-none"
    >
      Đặt hàng
    </Button>
  );

  const ContactList = contacts.map((contact) => {
    const Icon = getContactIcon(contact.type);
    const href = getContactHref(contact.type, contact.value);

    return (
      <a
        key={contact.id}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-6 cursor-pointer px-4 py-4 w-full hover:bg-muted/50 rounded-lg transition-colors group"
      >
        <Icon
          size={22}
          className="text-foreground/70 group-hover:text-primary transition-colors shrink-0"
        />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[13px] font-bold uppercase tracking-wider truncate text-foreground/90">
            {contact.label || contact.type}
          </span>
          <span className="text-[12px] text-muted-foreground truncate">
            {contact.value}
          </span>
        </div>
      </a>
    );
  });

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
        <DrawerContent className="px-container pb-12">
          <DrawerHeader className="px-0 pt-8 pb-4">
            <DrawerTitle className="text-left text-[14px] font-bold uppercase tracking-[0.2em] text-foreground">
              Liên hệ đặt hàng
            </DrawerTitle>
            <DrawerDescription className="text-left text-[11px]">
              Vui lòng chọn kênh liên hệ để được hỗ trợ tốt nhất.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-1 -mx-2">{ContactList}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{TriggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-2">
        <DropdownMenuLabel className="px-3 py-2 text-sm capitalize tracking-tight text-foreground">
          Liên hệ đặt hàng
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {contacts.map((contact) => {
          const Icon = getContactIcon(contact.type);
          const href = getContactHref(contact.type, contact.value);

          return (
            <DropdownMenuItem key={contact.id} asChild className="p-0">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-5 cursor-pointer px-4 py-3.5 w-full group"
              >
                <Icon
                  size={18}
                  className="text-foreground/60 group-hover:text-primary transition-colors shrink-0"
                />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider truncate text-foreground/90">
                    {contact.label || contact.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {contact.value}
                  </span>
                </div>
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
