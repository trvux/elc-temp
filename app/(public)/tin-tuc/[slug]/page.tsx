import { Button } from "@/shared/components/ui/button";
import { TypographyH1, TypographySmall } from "@/shared/components/ui/typography";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { cn } from "@/shared/lib/utils";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife, cacheTag } from "next/cache";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { getNewsBySlug, getNews } from "@/modules/news/application";

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
  const newsList = await getNews({ isPublished: true });
  const params = (newsList ?? []).map((n) => ({ slug: n.slug }));
  if (params.length === 0) {
    return [{ slug: "preview-stub" }];
  }
  return params;
}

async function getCachedNewsDetailData(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("news");
  setUseStaticClient(true);

  const newsItem = await getNewsBySlug(slug);
  const currentYear = new Date().getFullYear();

  return {
    newsItem,
    currentYear,
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Fetch current news detail using the cached helper
  const { newsItem, currentYear } = await getCachedNewsDetailData(slug);

  if (!newsItem || !newsItem.isPublished) {
    notFound();
  }

  const title = newsItem.title || "Tin tức";
  const createdAt = newsItem.createdAt || "";

  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }) : "";

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        <header>
          {formattedDate && (
            <TypographySmall className="text-muted-foreground mb-3 block">
              {formattedDate}
            </TypographySmall>
          )}
          <TypographyH1 className={STYLES.title}>{title}</TypographyH1>
        </header>

        <article>
          <PreviewContent content={newsItem.content} hideFirstHeading={true} />
        </article>

        <nav className={STYLES.footerNav}>
          <Button asChild>
            <Link href="/tin-tuc" className={STYLES.backLink}>
              <div className={STYLES.backLabel}>
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                <span>Xem các bài viết khác</span>
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
