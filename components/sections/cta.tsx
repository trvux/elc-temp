"use client";

import {
  EmailIcon,
  FacebookIcon,
  LinkIcon,
  MessengerIcon,
  PhoneIcon,
  WebsiteIcon,
  ZaloIcon,
} from "@/components/social-icons";
import { AnimateIn } from "@/components/ui/animate-in";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  TypographyH2,
  TypographyLarge,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from "@/components/ui/typography";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
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

// --- LOGIC HELPER (Tách ra ngoài cho sạch) ---
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
  const clean = value.replace(/\s/g, "");
  if (value.startsWith("http")) return value;
  const hrefs: Record<string, string> = {
    phone: `tel:${clean}`,
    email: `mailto:${value}`,
    zalo: `https://zalo.me/${clean}`,
    messenger: `https://m.me/${value}`,
    facebook: `https://facebook.com/${value}`,
  };
  return hrefs[type] || value;
};

export function CTASection({ settings, contacts }: CTASectionProps) {
  const isMobile = useIsMobile();
  const email = settings?.company_email || "contact@elc.com";
  const title = settings?.cta_title || "Nâng tầm chuẩn mực không gian.";
  const description =
    settings?.cta_description ||
    "Đội ngũ chuyên gia của ELC sẵn sàng đồng hành tư vấn giải pháp không khí tối ưu nhất, phù hợp đặc tính từng không gian kiến trúc.";

  // Render Item chung để không phải viết lại logic Link/Anchor
  const ContactLink = ({ contact }: { contact: Contact }) => {
    const Icon = getContactIcon(contact.type);
    const href = getContactHref(contact.type, contact.value);
    const isExternal = !["phone", "email"].includes(contact.type);

    return (
      <Link
        href={href}
        target={isExternal ? "_blank" : undefined}
        className={cn(
          "flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group w-full",
        )}
      >
        <Icon
          size={20}
          className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
        />
        <div className="flex flex-col text-left min-w-0">
          <TypographySmall>{contact.label || contact.type}</TypographySmall>
          <TypographyMuted>{contact.value}</TypographyMuted>
        </div>
      </Link>
    );
  };

  const SectionWrapper = "max-w-7xl mx-auto";
  const ContentWrapper =
    "flex flex-col items-center text-center max-w-3xl mx-auto gap-10";

  // Class cho Contact Items
  const ContactItemBase = cn(
    "flex items-center gap-4 group transition-colors w-full",
    "px-3 py-3", // Padding chung cho cả dropdown và drawer
  );

  const IconWrapper =
    "text-muted-foreground group-hover:text-primary transition-colors shrink-0";
  return (
    <section className={SectionWrapper}>
      <AnimateIn className="flex flex-col items-center text-center max-w-3xl mx-auto gap-10">
        <TypographyH2>{title}</TypographyH2>

        <TypographyP>{description}</TypographyP>

        {/* TRIGGER BUTTON */}
        <div className="w-full sm:w-auto">
          {isMobile ? (
            <Drawer>
              <DrawerTrigger asChild>
                <Button size="lg" className="w-full">
                  {settings?.cta_primary_btn_text || "Liên hệ ngay"}
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <TypographyLarge>Kênh liên hệ hỗ trợ</TypographyLarge>
                  <TypographyMuted>
                    Vui lòng chọn kênh để chúng tôi hỗ trợ tốt nhất.
                  </TypographyMuted>
                </DrawerHeader>
                <div className="flex flex-col gap-1">
                  {contacts.map((c) => (
                    <ContactLink key={c.id} contact={c} />
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg">
                  {settings?.cta_primary_btn_text || "Liên hệ ngay"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-fit p-2 bg-cream shadow-2xl border-none"
              >
                <DropdownMenuLabel>Kênh hỗ trợ</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {contacts.map((c) => (
                  <DropdownMenuItem key={c.id} asChild>
                    <ContactLink contact={c} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Separator />

        {/* FOOTER EMAIL */}
        <div className="flex flex-col items-center gap-3">
          <TypographyMuted>Hoặc kết nối qua email</TypographyMuted>
          <Link href={`mailto:${email}`} className="group relative">
            <TypographyLarge>{email}</TypographyLarge>
            <div className="absolute -bottom-1 left-0 w-full h-px bg-primary/20 group-hover:bg-primary transition-colors" />
          </Link>
        </div>
      </AnimateIn>
    </section>
  );
}
