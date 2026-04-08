"use client";

import * as React from "react";
import { Phone, Mail, Globe, Link as LinkIcon, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ZaloIcon, MessengerIcon, FacebookIcon } from "@/components/social-icons";

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
  if (!contacts || contacts.length === 0) return null;

  const getContactIcon = (type: string) => {
    switch (type) {
      case "phone": return Phone;
      case "email": return Mail;
      case "facebook": return FacebookIcon;
      case "messenger": return MessengerIcon;
      case "zalo": return ZaloIcon;
      case "website": return Globe;
      default: return LinkIcon;
    }
  };

  const getContactHref = (type: string, value: string) => {
    const cleanValue = value.replace(/\s/g, "");
    if (value.startsWith("http")) return value;
    
    switch (type) {
      case "phone": return `tel:${cleanValue}`;
      case "email": return `mailto:${value}`;
      case "zalo": return `https://zalo.me/${cleanValue}`;
      case "messenger": return `https://m.me/${value}`;
      case "facebook": return `https://facebook.com/${value}`;
      default: return value;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full py-4 border border-foreground text-[10px] font-bold capitalize tracking-[0.3em] hover:bg-foreground hover:text-background transition-all duration-300">
          Đặt hàng
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest opacity-50">
          Liên hệ đặt hàng
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {contacts.map((contact) => {
          const Icon = getContactIcon(contact.type);
          const href = getContactHref(contact.type, contact.value);
          
          return (
            <DropdownMenuItem key={contact.id} asChild>
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 cursor-pointer py-2.5"
              >
                <Icon size={16} strokeWidth={1.5} className="text-muted-foreground" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {contact.label || contact.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
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
