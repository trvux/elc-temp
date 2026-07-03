import { getBranchBySlug } from "@/modules/branch/application";
import { branchRepo } from "@/modules/branch/infrastructure/branchRepo";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
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
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { cacheLife, cacheTag } from "next/cache";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import { Metadata } from "next";
import { getPublicLayoutData } from "@/modules/settings";
import { generateBranchDetailSchema, sanitizeAndFormatTitle, BASE_URL } from "@/shared/lib/seo-utils";
import { GridSection } from "@/shared/components/sections/grid-section";

// Helper to control Google Maps zoom level
const getZoomedUrl = (url: string, zoomLevel = "15") => {
  return url.replace(/!4f[\d.]+/, `!4f${zoomLevel}`);
};

// Design System / Style Constants
const STYLES = {
  title: cn("w-full max-w-none! text-wrap!"),
  section: cn("w-full"),
  accordion: cn("w-full"),
  accordionItem: cn("flex flex-col gap-4 border-b last:border-b-0"),
  accordionContent: cn("text-lg"),
  prose: cn("prose prose-neutral max-w-none dark:prose-invert"),
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



async function getBranchData(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("layout");
  setUseStaticClient(true);
  const branch = await getBranchBySlug(branchRepo, slug);
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { branch } = await getBranchData(slug);

  if (!branch || !branch.isPublished) {
    return {
      title: "Không tìm thấy thông tin | ELC",
    };
  }

  const title = sanitizeAndFormatTitle(branch.metaTitle || branch.name, false);
  const description = branch.metaDescription || branch.name;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/thong-tin/${slug}`,
    },
    openGraph: {
      title,
      description,
      images: branch.imageUrl ? [branch.imageUrl] : [],
    },
  };
}

export default async function BranchDetail({ params }: Props) {
  const { slug } = await params;
  const { branch, branches, settings, contacts, currentYear } = await getBranchData(slug);

  if (!branch || !branch.isPublished) {
    notFound();
  }

  const branchSchema = generateBranchDetailSchema(branch, branches, settings, contacts);

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(branchSchema) }}
      />
      {/* ===== KHỐI 1: CHI TIẾT CƠ SỞ ===== */}
      <GridSection
        id="branch-detail-content"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-10 md:py-16"
      >
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 animate-fade-in-up">
          <div>
            <Link
              href="/thong-tin"
              className="group inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              <span>Quay lại danh mục</span>
            </Link>
            <TypographyH1 className="w-full max-w-none! text-wrap! font-heading leading-tight">
              {branch.name}
            </TypographyH1>
            {branch.imageUrl && (
              <div className="w-full mt-6 overflow-hidden rounded-sm border border-border/40">
                <AspectRatio ratio={16 / 9}>
                  <ImageWithSkeleton
                    wrapperClassName="w-full h-full"
                    src={branch.imageUrl}
                    alt={branch.name}
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

          <article className="w-full">
            <PreviewContent
              content={branch.description}
              hideFirstHeading={true}
              fallbackAlt={branch.name}
            />
          </article>
        </div>
      </GridSection>

      {/* ===== KHỐI 3: FOOTER BẢN QUYỀN ===== */}
      <GridSection
        id="branch-detail-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <footer className="w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </GridSection>

      {/* ===== KHỐI 4: BREADCRUMBS ===== */}
      <GridSection
        id="branch-detail-breadcrumbs"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <div className="w-full">
          <Breadcrumbs
            items={[
              { label: "Thông tin", href: "/thong-tin" },
              { label: branch.name, active: true },
            ]}
          />
        </div>
      </GridSection>
    </main>
  );
}
