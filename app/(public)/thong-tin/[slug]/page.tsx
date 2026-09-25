import type { Metadata } from "next";
import { getBranchBySlugAction } from "@/modules/branch/presentation/actions";
import { PreviewContent } from "@/shared/components/organisms/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/organisms/layout/user/scroll-to-top";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  TypographyH1,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/shared/components/organisms/layout/user/breadcrumbs";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { getPublicLayoutData } from "@/modules/settings";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import { excerptFromRichText } from "@/shared/lib/rich-text";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { BASE_URL } from "@/shared/lib/seo-schema";

// Helper to control Google Maps zoom level
const getZoomedUrl = (url: string, zoomLevel = "15") => {
  return url.replace(/!4f[\d.]+/, `!4f${zoomLevel}`);
};

// Design System / Style Constants
const STYLES = {
  // The old GridSection component (dashed-line + diamond dividers between
  // sections) was removed entirely (2026-09-24) — sections are now
  // separated by plain spacing only. Every section below is a plain div
  // pair sharing this container class, plus its own py-* override.
  sectionContainer: cn(
    "mx-auto h-full w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-12 relative",
  ),
  title: cn("w-full max-w-none! text-balance!"),
  section: cn("w-full max-w-2xl mx-auto"),
  accordion: cn("w-full"),
  accordionItem: cn("flex flex-col gap-4 border-b last:border-b-0"),
  accordionContent: cn("text-lg"),
  mapCard: cn("m-1 overflow-hidden p-2 shadow-sm bg-background/60"),
  mapIframe: cn(
    "w-full h-full rounded-lg transition-all duration-2000 ease-in-out ",
  ),
  backLink: "group inline-flex items-center",
  backLabel: "flex items-center gap-2",
};

interface Props {
  params: Promise<{ slug: string }>;
}

// Lighter than getBranchData below (which also fetches getPublicLayoutData
// for the header/footer) — generateMetadata only needs the branch itself.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const branch = await getBranchBySlugAction(slug).then(unwrapActionResult);
  if (!branch || !branch.isPublished) return {};

  const title = branch.metaTitle || `${branch.name} | Điện máy ELC`;
  const description =
    branch.metaDescription || excerptFromRichText(branch.description) || branch.address;
  const image = primaryImageUrl(branch.images);
  const pageUrl = `${BASE_URL}/thong-tin/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      title,
      description,
      url: pageUrl,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

async function getBranchData(slug: string) {
  const branch = await getBranchBySlugAction(slug).then(unwrapActionResult);
  const currentYear = new Date().getFullYear();
  const { settings, contacts, branches } = await getPublicLayoutData();
  return {
    branch,
    branches,
    settings,
    contacts,
    currentYear,
  };
}

export default async function BranchDetail({ params }: Props) {
  const { slug } = await params;
  const { branch, currentYear } = await getBranchData(slug);

  if (!branch || !branch.isPublished) {
    notFound();
  }

  const items = [
    {
      value: "address",
      trigger: "Địa chỉ cơ sở hạ tầng",
      content: (
        <div className="flex flex-col gap-4">
          <span>{branch.address}</span>
          {branch.mapsEmbed && (
            <Card className={STYLES.mapCard}>
              <CardContent className="p-0">
                <AspectRatio ratio={16 / 9}>
                  <iframe
                    src={getZoomedUrl(
                      branch.mapsEmbed.match(/src="([^"]+)"/)?.[1] ||
                        branch.mapsEmbed,
                      "15",
                    )}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className={STYLES.mapIframe}
                  />
                </AspectRatio>
              </CardContent>
            </Card>
          )}
        </div>
      ),
      isVisible: !!branch.address,
    },
    {
      value: "phone",
      trigger: "Số điện thoại liên hệ",
      content: (
        <a href={`tel:${branch.phone?.replace(/\s/g, "")}`} className="hover:underline">
          {branch.phone || ""}
        </a>
      ),
      isVisible: !!branch.phone,
    },
    {
      value: "email",
      trigger: "Địa chỉ email",
      content: (
        <a href={`mailto:${branch.email}`} className="hover:underline">
          {branch.email}
        </a>
      ),
      isVisible: !!branch.email,
    },
  ].filter((item) => item.isVisible);

  return (
    <main className="w-full bg-background min-h-screen flex flex-col">
      {/* ===== KHỐI 1: CHI TIẾT CƠ SỞ ===== */}
      <div id="branch-detail-content" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-10 md:py-16")}>
        {/* Body copy stays at max-w-2xl (672px, closest Tailwind step to
            Linear's measured 624px blog column) for readability, but the
            header block (back link/title/image) and the accordion/article
            below are allowed to widen fluidly — matching Linear's own h1,
            which is NOT stepped: width = min(900px, 100% - 3rem) at every
            viewport from 500px to 1920px (dense sweep, ~20 widths), never
            jumping the way a sm:/md:/lg: breakpoint would (a first attempt
            using stepped md:/lg: classes visibly mismatched Linear at
            in-between widths). A single max-w-[Nrem] (no breakpoint
            variants) reproduces that fluid-then-capped curve here, since
            this wrapper already sits inside sectionContainer's own
            padding, so "100%" is already viewport-relative.

            The cap is 56.25rem (900px) — Linear's own exact number.
            Getting here took 3 attempts: Google Fonts' "Inter" rendered the
            A/B test string at 907px unwrapped (9% over cap). Self-hosting
            fontsource's "Inter Variable" build brought that to 892px
            (still over). Self-hosting Linear's OWN served font file
            directly — fetched from static.linear.app's actual network
            request, not a same-named package from a different vendor/
            build (see app/layout.tsx, 2026-09-25) — brought it to 828.9px,
            matching Linear's own 834.7px within measurement noise. Full
            viewport sweep (500-1920px) now matches Linear's wrap points at
            every checked width. Body text's max-w-2xl doesn't need this —
            Linear's paragraph column is a flat 624px, no fluid range below
            that cap. */}
        <div className="max-w-[56.25rem] mx-auto w-full flex flex-col gap-6 animate-fade-in-up">
          <div>
            <Link
              href="/thong-tin"
              className="group inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              <span>Quay lại danh mục</span>
            </Link>
            <TypographyH1
              className={cn(
                "w-full max-w-none! text-balance! font-heading leading-tight",
                branch.nameAlign === "center" && "text-center",
                branch.nameAlign === "right" && "text-right",
              )}
            >
              {branch.name}
            </TypographyH1>
            {primaryImageUrl(branch.images) && (
              <div className="w-full mt-6 overflow-hidden rounded-sm border border-border/40">
                <AspectRatio ratio={16 / 9}>
                  <Image
                    src={primaryImageUrl(branch.images)!}
                    alt={branch.images[0]?.alt || branch.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </AspectRatio>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <section className={STYLES.section}>
              <Accordion
                type="single"
                collapsible
                className={STYLES.accordion}
                defaultValue="address"
              >
                {items.map((item) => (
                  <AccordionItem
                    key={item.value}
                    value={item.value}
                    className={STYLES.accordionItem}
                  >
                    <AccordionTrigger className="text-lg font-semibold">
                      {item.trigger}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className={STYLES.accordionContent}>{item.content}</div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          <article className="w-full max-w-2xl mx-auto">
            <PreviewContent
              content={branch.description}
              fallbackAlt={branch.name}
            />
          </article>
        </div>
        </div>
      </div>

      {/* ===== KHỐI 3: FOOTER BẢN QUYỀN ===== */}
      <div id="branch-detail-footer" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-6 md:py-8 lg:py-10")}>
          <footer className="w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
            <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
            <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
              <TypographySmall>Quay lại đầu trang</TypographySmall>
            </ScrollToTop>
          </footer>
        </div>
      </div>

      {/* ===== KHỐI 4: BREADCRUMBS ===== */}
      <div id="branch-detail-breadcrumbs" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-1")}>
          <div className="w-full">
            <Breadcrumbs
              items={[
                { label: "Thông tin", href: "/thong-tin" },
                { label: branch.name, active: true },
              ]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
