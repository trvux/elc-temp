import { getPageBySlug } from "@/modules/page/application";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { Button } from "@/shared/components/ui/button";
import {
  TypographyH1,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { Metadata } from "next";
import { GridSection } from "@/shared/components/sections/grid-section";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}



async function getCachedPageData(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("layout");
  setUseStaticClient(true);
  return getPageBySlug(slug);
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

  const title = page.metaTitle || `${page.title} | Điện máy ELC`;
  const description = page.metaDescription || page.title;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
  };
}

async function getCachedCurrentYear() {
  "use cache";
  return new Date().getFullYear();
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch current page content using the application layer
  const page = await getCachedPageData(slug);

  if (!page || !page.isPublished) {
    notFound();
  }

  const currentYear = await getCachedCurrentYear();

  return (
    <main className="w-full bg-background min-h-screen flex flex-col">
      {/* ===== KHỐI 1: TIÊU ĐỀ CHI TIẾT ===== */}
      <GridSection
        id="static-page-header"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-8 md:py-12"
      >
        <div className="max-w-3xl mx-auto w-full">
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
          <TypographyH1 className="w-full max-w-none! text-wrap! text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading leading-tight">
            {page.title}
          </TypographyH1>
        </div>
      </GridSection>

      {/* ===== KHỐI 2: NỘI DUNG TRANG ===== */}
      <GridSection
        id="static-page-content"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-10 md:py-16"
      >
        <div className="max-w-3xl mx-auto w-full">
          <article>
            <PreviewContent content={page.content} hideFirstHeading={true} />
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
            disableJsonLd={true}
          />
        </div>
      </GridSection>
    </main>
  );
}
