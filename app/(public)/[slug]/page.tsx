import { Button } from "@/shared/components/ui/button";
import { TypographyH1, TypographySmall } from "@/shared/components/ui/typography";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { cn } from "@/shared/lib/utils";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPageBySlug, getPages } from "@/modules/page/application";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife } from "next/cache";

// Design System / Style Constants
const STYLES = {
  main: cn("w-full min-h-screen py-10 px-4 md:py-20"),
  container: cn("max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in-up"),
  title: cn("w-full max-w-none! text-wrap!"),
  footerNav: "mt-10",
  backLink: "group inline-flex items-center",
  backLabel: "flex items-center gap-2",
  footer:
    "mt-10 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-10 text-muted-foreground",
};

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const pages = await getPages({ isPublished: true });
  const params = (pages ?? []).map((p) => ({ slug: p.slug }));
  if (params.length === 0) {
    return [{ slug: "preview-stub" }];
  }
  return params;
}

async function getCachedPageData(slug: string) {
  "use cache";
  cacheLife("hours");
  setUseStaticClient(true);
  return getPageBySlug(slug);
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
    // Nếu không tìm thấy trang thông tin, tự động redirect sang Tin tức (cứu link WordPress cũ)
    redirect(`/tin-tuc/${slug}`);
  }

  const currentYear = await getCachedCurrentYear();

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        <header>
          <TypographySmall className="text-muted-foreground mb-3 block">
            {new Date(page.createdAt || "2026-06-10T00:00:00.000Z").toLocaleDateString("vi-VN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </TypographySmall>
          <TypographyH1 className={STYLES.title}>{page.title}</TypographyH1>
        </header>

        <article>
          <PreviewContent content={page.content} hideFirstHeading={true} />
        </article>

        <nav className={STYLES.footerNav}>
          <Button asChild>
            <Link href="/thong-tin" className={STYLES.backLink}>
              <div className={STYLES.backLabel}>
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                <span>Quay lại danh mục</span>
              </div>
            </Link>
          </Button>
        </nav>

        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {currentYear} ELC Holdings. Đã đăng ký bản
            quyền.
          </TypographySmall>
          <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
