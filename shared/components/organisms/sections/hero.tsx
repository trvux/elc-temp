import Image from "next/image";
import { Brand } from "@/modules/brand/domain";
import { Contact } from "@/modules/contact/domain";
import { ContactIcon } from "@/modules/contact/presentation/utils";
import { Button } from "@/shared/components/ui/button";
import { TypographyP } from "@/shared/components/ui/typography";
import { HeroBrandMarquee } from "./hero-brand-marquee";
import { HeroRotatingWord } from "./hero-rotating-word";

interface HeroSectionProps {
  contacts?: Contact[];
  brands?: Brand[];
}

function pickContact(contacts: Contact[], type: Contact["type"]): Contact | undefined {
  return (
    contacts.find((c) => c.type === type && c.isActive) ||
    contacts.find((c) => c.type === type)
  );
}

// Business content (headline, CTA) stays driven by real contact data.
export function HeroSection({ contacts = [], brands = [] }: HeroSectionProps) {
  const phoneContact = pickContact(contacts, "phone");
  const zaloContact = pickContact(contacts, "zalo");

  return (
    <section
      // -mt cancels the (public) layout's fixed-header clearance so this
      // full-bleed section reaches the very top, matching the reference:
      // the header sits transparently over the hero, not above it. Content
      // is top-anchored (pt-*, items-start) rather than true-centered so it
      // sits in the clear sky area of the bg photo instead of getting
      // covered by the clouds lower down.
      className="relative -mt-16 flex h-screen min-h-163 w-full items-start justify-center overflow-hidden bg-black pt-28 sm:pt-32 lg:pt-40"
    >
      <Image
        src="/images/hero-section-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Darkens the bright sky photo so the white headline/copy stays
          readable, and blends it into solid black before the section's
          hard bottom edge so the next section's bg-black reads as a
          continuation rather than a sudden cut. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] bg-black/30 lg:bg-black/20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-1/3 bg-gradient-to-b from-transparent to-black"
      />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 text-center select-none sm:gap-6">
        <span className="text-sm font-semibold text-white/70">
          Điện máy ELC
        </span>

        <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
          Giải pháp Không khí{" "}
          <span className="inline-block">
            <HeroRotatingWord />
          </span>
        </h1>

        <TypographyP className="max-w-md text-base leading-relaxed text-white/80 drop-shadow-sm sm:text-lg">
          Cung cấp, thi công lắp đặt trọn gói các dòng điều hòa không khí, hệ
          thống cấp khí tươi thu hồi nhiệt và lọc không khí cho công trình
          dân dụng đến công nghiệp từ những thương hiệu uy tín hàng đầu.
        </TypographyP>

        {/* CTA pair ported from the reference's Github/Medium buttons: a
            solid primary action + a translucent glass secondary one. `dark`
            scopes `foreground`/`border` to their dark-theme values here so
            the glass button reads correctly regardless of the site's actual
            light/dark setting — the hero backdrop is always dark. Colors
            come from theme tokens (not hardcoded white/black) so swapping
            the shadcn theme later just works. */}
        {(phoneContact || zaloContact) && (
          <div className="dark mt-2 flex w-full flex-col items-center justify-center gap-2.5 sm:mt-4 sm:w-auto sm:flex-row sm:gap-3.5">
            {phoneContact && (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <a
                  href={phoneContact.href}
                  target={phoneContact.isExternal ? "_blank" : undefined}
                  rel={phoneContact.isExternal ? "noopener noreferrer" : undefined}
                >
                  <ContactIcon type="phone" className="size-4" />
                  Gọi ngay - {phoneContact.value}
                </a>
              </Button>
            )}

            {zaloContact && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full border-foreground/15 bg-foreground/5 text-foreground backdrop-blur-md hover:bg-foreground/10 hover:text-foreground sm:w-auto"
              >
                <a
                  href={zaloContact.href}
                  target={zaloContact.isExternal ? "_blank" : undefined}
                  rel={zaloContact.isExternal ? "noopener noreferrer" : undefined}
                >
                  <ContactIcon type="zalo" className="size-4" />
                  Tư vấn miễn phí
                </a>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Sits low inside the hero itself (not a separate section below it),
          matching the reference's tool-logo row layered over its photo. */}
      {brands.length > 0 && (
        <div className="absolute inset-x-0 bottom-10 z-10 px-6 md:bottom-14">
          <HeroBrandMarquee brands={brands} caption="Đối tác thương hiệu" />
        </div>
      )}
    </section>
  );
}
