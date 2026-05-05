"use client";

import {
  EmailIcon,
  FacebookIcon,
  LinkIcon,
  MessengerIcon,
  PhoneIcon,
  WebsiteIcon,
  ZaloIcon,
} from "@/shared/components/ui/social-icons";
import { AnimateIn } from "@/shared/components/ui/animate-in";
import { Button } from "@/shared/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTrigger,
} from "@/shared/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Separator } from "@/shared/components/ui/separator";
import {
  TypographyH1,
  TypographyLarge,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import Link from "next/link";

import { Contact } from "@/modules/contact/domain";

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

  // --- STYLES ---
  const styles = {
    section: "max-w-7xl mx-auto py-20 px-6",
    container:
      "flex flex-col items-center text-center max-w-3xl mx-auto gap-12",
    contactList: "flex flex-col gap-1 p-2",
    contactItem:
      "flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-all duration-300 group w-full",
    icon: "shrink-0 text-muted-foreground group-hover:text-primary transition-colors",
    emailBox: "flex flex-col items-center gap-3",
    emailLink: "group relative py-1",
    emailUnderline:
      "absolute bottom-0 left-0 w-full h-px bg-primary/20 group-hover:bg-primary transition-all duration-300",
    dropdown: "min-w-64 p-3 bg-cream shadow-2xl border-none rounded-2xl",
    trigger: "w-full sm:w-auto",
  };

  const ContactLink = ({ contact }: { contact: Contact }) => {
    const Icon = getContactIcon(contact.type);
    const href = getContactHref(contact.type, contact.value);
    const isExternal = !["phone", "email"].includes(contact.type);

    return (
      <Link
        href={href}
        target={isExternal ? "_blank" : undefined}
        className={styles.contactItem}
      >
        <Icon size={20} className={styles.icon} />
        <div className="flex flex-col text-left min-w-0">
          <TypographySmall className="font-semibold">
            {contact.label || contact.type}
          </TypographySmall>
          <TypographyMuted className="text-xs truncate">
            {contact.value}
          </TypographyMuted>
        </div>
      </Link>
    );
  };

  const ContactList = () => (
    <div className={styles.contactList}>
      {contacts.map((c) => (
        <ContactLink key={c.id} contact={c} />
      ))}
    </div>
  );

  const CTAButton = () => (
    <Button size="lg" className="w-full sm:w-auto px-8">
      {settings?.cta_primary_btn_text || "Liên hệ ngay"}
    </Button>
  );

  return (
    <section className={styles.section}>
      <AnimateIn className={styles.container}>
        <div className="space-y-4">
          <TypographyH1>{title}</TypographyH1>
          <TypographyP className="text-muted-foreground">
            {description}
          </TypographyP>
        </div>

        <div className={styles.trigger}>
          {isMobile ? (
            <Drawer>
              <DrawerTrigger asChild>
                <div className="w-full">
                  <CTAButton />
                </div>
              </DrawerTrigger>
              <DrawerContent className="p-4">
                <DrawerHeader className="text-left px-2">
                  <TypographyLarge>Kênh liên hệ hỗ trợ</TypographyLarge>
                  <TypographyMuted>
                    Vui lòng chọn kênh để chúng tôi hỗ trợ tốt nhất.
                  </TypographyMuted>
                </DrawerHeader>
                <ContactList />
              </DrawerContent>
            </Drawer>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div>
                  <CTAButton />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className={styles.dropdown}>
                <DropdownMenuLabel className="px-3 pb-2 uppercase tracking-widest text-[10px] text-muted-foreground">
                  Kênh liên hệ
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-3" />
                <ContactList />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Separator className="max-w-xs opacity-50" />

        <div className={styles.emailBox}>
          <TypographyMuted>Hoặc kết nối trực tiếp qua email</TypographyMuted>
          <Link href={`mailto:${email}`} className={styles.emailLink}>
            <TypographyLarge className="font-newsreader italic text-2xl">
              {email}
            </TypographyLarge>
            <div className={styles.emailUnderline} />
          </Link>
        </div>
      </AnimateIn>
    </section>
  );
}
