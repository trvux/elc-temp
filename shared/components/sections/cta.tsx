"use client";

import { AnimateIn } from "@/shared/components/ui/animate-in";
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
import { Separator } from "@/shared/components/ui/separator";
import {
  TypographyH1,
  TypographyLarge,
  TypographyMuted,
  TypographyP,
} from "@/shared/components/ui/typography";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import Link from "next/link";

import { Contact } from "@/modules/contact/domain";

interface CTASectionProps {
  settings?: Record<string, string>;
  contacts: Contact[];
}

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

  const ContactList = ({ isDrawer = false }: { isDrawer?: boolean }) => (
    <div className="flex flex-col gap-1">
      {contacts.map((c) => {
        const href = getContactHref(c.type, c.value);
        const label = c.label || c.type;
        const isExternal = !["phone", "email"].includes(c.type);

        if (isDrawer) {
          return (
            <Link
              key={c.id}
              href={href}
              target={isExternal ? "_blank" : undefined}
              className="flex flex-col py-3 px-2"
            >
              <span className="font-medium capitalize">{label}</span>
              <span className="text-xs text-muted-foreground">{c.value}</span>
            </Link>
          );
        }

        return (
          <DropdownMenuItem
            key={c.id}
            onClick={() => window.open(href, isExternal ? "_blank" : "_self")}
          >
            {label}
          </DropdownMenuItem>
        );
      })}
    </div>
  );

  return (
    <section className="max-w-7xl mx-auto py-20 px-6">
      <AnimateIn className="flex flex-col items-center text-center max-w-3xl mx-auto gap-12">
        <div className="space-y-4">
          <TypographyH1>{title}</TypographyH1>
          <TypographyP className="text-muted-foreground">
            {description}
          </TypographyP>
        </div>

        <div>
          {isMobile ? (
            <Drawer>
              <DrawerTrigger asChild>
                <Button size="lg" className="px-16">
                  {settings?.cta_primary_btn_text || "Liên hệ ngay"}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="p-4">
                <DrawerHeader className="text-left px-2">
                  <DrawerTitle>Kênh liên hệ hỗ trợ</DrawerTitle>
                  <DrawerDescription>
                    Vui lòng chọn kênh để chúng tôi hỗ trợ tốt nhất.
                  </DrawerDescription>
                </DrawerHeader>
                <ContactList isDrawer />
              </DrawerContent>
            </Drawer>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" className="px-16">
                  {settings?.cta_primary_btn_text || "Liên hệ ngay"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuLabel>Kênh liên hệ</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ContactList />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Separator className="max-w-xs opacity-50" />

        <div className="flex flex-col items-center gap-3">
          <TypographyMuted>Hoặc kết nối trực tiếp qua email</TypographyMuted>
          <Link href={`mailto:${email}`}>
            <TypographyLarge className="font-newsreader italic text-2xl">
              {email}
            </TypographyLarge>
          </Link>
        </div>
      </AnimateIn>
    </section>
  );
}
