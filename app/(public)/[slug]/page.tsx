import { getPageBySlugAction } from "@/modules/page/presentation/actions";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { Button } from "@/shared/components/ui/button";
import {
  TypographyH1,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { Metadata } from "next";
import {
  BASE_URL,
  generateBreadcrumbSchema,
  sanitizeAndFormatTitle,
} from "@/shared/lib/seo-utils";
import { GridSection } from "@/shared/components/sections/grid-section";
import { unwrapActionResult } from "@/shared/lib/action-result";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}



async function getCachedPageData(slug: string) {
  return getPageBySlugAction(slug).then(unwrapActionResult);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCachedPageData(slug);

  if (!page) {
    return {
      title: "Không tìm thấy trang | ELC",
    };
  }

  const title = sanitizeAndFormatTitle(page.metaTitle || page.title, false);
  const description = page.metaDescription || page.title;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${page.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${page.slug}`,
      type: "article",
    },
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

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { label: "Thông tin", href: "/thong-tin" },
      { label: page.title },
    ],
    `${BASE_URL}/${page.slug}`,
  );

  return (
    <main className="w-full bg-background min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* ===== KHỐI 1: CHI TIẾT TRANG ===== */}
      <GridSection
        id="static-page-content"
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
            <TypographySmall className="text-muted-foreground/60 mb-2 block font-medium font-sans">
              {new Date(
                page.createdAt || "2026-06-10T00:00:00.000Z",
              ).toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </TypographySmall>
            <TypographyH1 className="w-full max-w-none! text-wrap! font-heading leading-tight">
              {page.title}
            </TypographyH1>
          </div>
          <article>
            <PreviewContent
              content={page.content}
              fallbackAlt={page.title}
            />
          </article>
        </div>
      </GridSection>

      {/* ===== KHỐI 3: FOOTER BẢN QUYỀN ===== */}
      <GridSection
        id="static-page-footer"
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
        id="static-page-breadcrumbs"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <div className="w-full">
          <Breadcrumbs
            items={[
              { label: "Thông tin", href: "/thong-tin" },
              { label: page.title, active: true },
            ]}
          />
        </div>
      </GridSection>
    </main>
  );
}
