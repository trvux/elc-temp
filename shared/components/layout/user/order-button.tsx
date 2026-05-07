"use client";

import { Button } from "@/shared/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  EmailIcon,
  FacebookIcon,
  LinkIcon,
  MessengerIcon,
  PhoneIcon,
  WebsiteIcon,
  ZaloIcon,
} from "@/shared/components/ui/social-icons";
import { TypographyLarge } from "@/shared/components/ui/typography";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import Link from "next/link";
import { trackEvent } from "@/shared/lib/tracking";

import { Contact } from "@/modules/contact/domain";

interface OrderButtonProps {
  contacts: Contact[];
}

const STYLES = {
  trigger: cn("w-full lg:w-auto"),

  item: {
    base: cn("flex items-center cursor-pointer w-full group transition-colors"),
    drawer: cn("gap-6 px-4 py-4 hover:bg-muted/50 rounded-lg"),
    dropdown: cn("gap-5 px-4 py-3.5"),
    icon: cn(
      "text-foreground/70 group-hover:text-primary transition-colors shrink-0",
    ),
    info: cn("flex flex-col gap-0.5 min-w-0 text-left"),
    label: cn("font-bold tracking-wider truncate text-foreground/90"),
    value: cn("text-xs text-muted-foreground truncate"),
  },
};

const getContactIcon = (type: string) => {
  const icons: Record<string, any> = {
    phone: PhoneIcon,
    email: EmailIcon,
    facebook: FacebookIcon,
    messenger: MessengerIcon,
    zalo: ZaloIcon,
    website: WebsiteIcon,
  };
  return icons[type] || LinkIcon;
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

export function OrderButton({ contacts }: OrderButtonProps) {
  const isMobile = useIsMobile();

  if (!contacts || contacts.length === 0) return null;

  const COMMON_TITLE = "Kênh liên hệ hỗ trợ";
  const COMMON_DESC =
    "Vui lòng chọn kênh liên hệ để chúng tôi hỗ trợ bạn tốt nhất.";

  // Shared responsive Trigger Button
  const TriggerButton = (
    <Button size="lg" className={STYLES.trigger}>
      <TypographyLarge>Tư vấn kỹ thuật</TypographyLarge>
    </Button>
  );

  const renderContactItem = (contact: Contact, isDropdown = false) => {
    const Icon = getContactIcon(contact.type);
    const href = getContactHref(contact.type, contact.value);
    const isProtocol = ["phone", "email"].includes(contact.type);

    const handleContactClick = () => {
      const isConversion = ["phone", "zalo", "messenger", "email", "facebook"].includes(contact.type);
      
      trackEvent({
        action: "contact_click",
        category: isConversion ? "conversion" : "engagement",
        label: `${contact.type}: ${contact.value}`,
        isConversion,
        metadata: {
          location: "order_button",
          contact_type: contact.type
        }
      });
    };

    const content = (
      <div
        className={cn(
          STYLES.item.base,
          isDropdown ? STYLES.item.dropdown : STYLES.item.drawer,
        )}
      >
        <Icon size={isDropdown ? 18 : 22} className={STYLES.item.icon} />
        <div className={STYLES.item.info}>
          <span
            className={cn(
              STYLES.item.label,
              isDropdown ? "text-xs" : "text-sm",
            )}
          >
            {contact.label || contact.type}
          </span>
          <span className={STYLES.item.value}>{contact.value}</span>
        </div>
      </div>
    );

    if (isProtocol) {
      return (
        <a 
          key={contact.id} 
          href={href} 
          className="block w-full"
          onClick={handleContactClick}
        >
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
        className="block w-full"
        onClick={handleContactClick}
      >
        {content}
      </Link>
    );
  };

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{COMMON_TITLE}</DrawerTitle>
            <DrawerDescription>{COMMON_DESC}</DrawerDescription>
          </DrawerHeader>
          <div>{contacts.map((contact) => renderContactItem(contact))}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{TriggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="bottom">
        <DropdownMenuLabel>{COMMON_TITLE}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {contacts.map((contact) => (
          <DropdownMenuItem key={contact.id} asChild>
            {renderContactItem(contact, true)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
