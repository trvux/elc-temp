import type { Metadata } from "next";
import { getPageBySlugAction } from "@/modules/page/presentation/actions";
import { PreviewContent } from "@/shared/components/organisms/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/organisms/layout/user/scroll-to-top";
import {
  TypographyH1,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/shared/components/organisms/layout/user/breadcrumbs";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { cn } from "@/shared/lib/utils";

// The old GridSection component (dashed-line + diamond dividers between
// sections) was removed entirely (2026-09-24) — sections are now separated
// by plain spacing only. Every section below is a plain div pair sharing
// this container class, plus its own py-* override.
const SECTION_CONTAINER =
  "mx-auto h-full w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-12 relative";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getCachedPageData(slug: string) {
  return getPageBySlugAction(slug).then(unwrapActionResult);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCachedPageData(slug);
  if (!page || !page.isPublished) return {};

  const title = page.metaTitle || page.title;
  const description = page.metaDescription || undefined;
  return {
    title: `${title} | Điện máy ELC`,
    description,
    alternates: { canonical: `${BASE_URL}/${slug}` },
    openGraph: { type: "website", title, description, url: `${BASE_URL}/${slug}` },
  };
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch current page content using the application layer
  const page = await getCachedPageData(slug);

  if (!page || !page.isPublished) {
    notFound();
  }

  const currentYear = new Date().getFullYear();

  return (
    <main className="w-full bg-background min-h-screen flex flex-col">
      {/* ===== KHỐI 1: CHI TIẾT TRANG ===== */}
      <div id="static-page-content" className="w-full relative">
        <div className={cn(SECTION_CONTAINER, "py-10 md:py-16")}>
        {/* Body copy stays at max-w-2xl (672px, closest Tailwind step to
            Linear's measured 624px blog column) for readability, but the
            header block (back link/date/title) and article are allowed to
            widen at md/lg — matching Linear's own layout, where its h1's
            own container is measurably wider than its body-paragraph
            column (786px tablet / 900px desktop vs. a 624px-capped body),
            not tied to the same max-width. lg bumped from max-w-4xl (896px)
            to max-w-5xl (1024px) after A/B testing with Linear's exact
            title string side by side — 896px was only 11px short of the
            text's natural single-line width (907px at 48px/weight 600),
            just barely wrapping to 2 lines where Linear's fit on 1; 5xl
            gives headroom instead of chasing that one string's exact px. */}
        <div className="max-w-2xl md:max-w-3xl lg:max-w-5xl mx-auto w-full flex flex-col gap-6 animate-fade-in-up">
          <div>
            <Link
              href="/thong-tin"
              className="group inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              <span>Quay lại danh mục</span>
            </Link>
            <TypographySmall className="text-muted-foreground/60 mb-2 block font-medium font-sans">
              {new Date(
                page.createdAt || "2026-06-10T00:00:00.000Z",
              ).toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </TypographySmall>
            <TypographyH1
              className={cn(
                "w-full max-w-none! text-wrap! font-heading leading-tight",
                page.titleAlign === "center" && "text-center",
                page.titleAlign === "right" && "text-right",
              )}
            >
              {page.title}
            </TypographyH1>
          </div>
          <article className="max-w-2xl mx-auto w-full">
            <PreviewContent
              content={page.content}
              fallbackAlt={page.title}
            />
          </article>
        </div>
        </div>
      </div>

      {/* ===== KHỐI 3: FOOTER BẢN QUYỀN ===== */}
      <div id="static-page-footer" className="w-full relative">
        <div className={cn(SECTION_CONTAINER, "py-6 md:py-8 lg:py-10")}>
          <footer className="w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
            <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
            <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
              <TypographySmall>Quay lại đầu trang</TypographySmall>
            </ScrollToTop>
          </footer>
        </div>
      </div>

      {/* ===== KHỐI 4: BREADCRUMBS ===== */}
      <div id="static-page-breadcrumbs" className="w-full relative">
        <div className={cn(SECTION_CONTAINER, "py-1")}>
          <div className="w-full">
            <Breadcrumbs
              items={[
                { label: "Thông tin", href: "/thong-tin" },
                { label: page.title, active: true },
              ]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
