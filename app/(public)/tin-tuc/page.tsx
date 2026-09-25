import type { Metadata } from "next";
import { getNewsAction } from "@/modules/news/presentation/actions";
import { Breadcrumbs } from "@/shared/components/organisms/layout/user/breadcrumbs";
import { ScrollToTop } from "@/shared/components/organisms/layout/user/scroll-to-top";
import { PageHero } from "@/shared/components/organisms/sections/page-hero";
import Image from "next/image";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import {
  TypographyH2,
  TypographySmall,
} from "@/shared/components/ui/typography";
import Link from "next/link";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { getExcerptFromContent } from "@/shared/lib/rich-text";
import { BASE_URL, toJsonLdHtml } from "@/shared/lib/seo-schema";
import { cn } from "@/shared/lib/utils";

export const metadata: Metadata = {
  title: "Tin tức & kiến thức điện lạnh | Điện máy ELC",
  description:
    "Cập nhật kiến thức kỹ thuật, hướng dẫn sử dụng và bảo trì máy lạnh, điều hòa, hệ thống khí tươi từ đội ngũ kỹ sư Điện máy ELC.",
  alternates: { canonical: `${BASE_URL}/tin-tuc` },
};

const STYLES = {
  main: "w-full bg-background min-h-screen",
  // The old GridSection component (dashed-line + diamond dividers between
  // sections) was removed entirely (2026-09-24) — sections are now
  // separated by plain spacing only. Every section below is a plain div
  // pair sharing this container class, plus its own py-* override.
  sectionContainer:
    "mx-auto h-full w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-12 relative",
  list: "flex flex-col w-full min-h-[400px] animate-fade-in-up",
  article:
    "group flex flex-row justify-between items-center gap-4 sm:gap-6 md:gap-8 py-8 border-b border-border/60 last:border-b-0 no-underline transition-all duration-300 w-full",
  textWrapper: "flex-1 min-w-0 flex flex-col gap-1.5 md:gap-2",
  date: "text-xs text-muted-foreground font-sans",
  articleTitle:
    "text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-foreground/70 transition-colors line-clamp-2 leading-snug font-heading",
  articleDescription:
    "text-xs sm:text-sm md:text-base text-muted-foreground line-clamp-2 md:line-clamp-3 leading-relaxed",
  imageWrapper:
    "shrink-0 relative w-36 aspect-video sm:w-48 md:w-64 rounded-lg overflow-hidden",
  image: "object-cover",
  footer:
    "w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground",
  scrollToTop:
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
};

async function getCachedNewsHubData() {
  const allNews = await getNewsAction({
    isPublished: true,
    sortBy: "created_at",
    sortOrder: "desc",
  }).then(unwrapActionResult);
  const currentYear = new Date().getFullYear();

  return {
    allNews: allNews ?? [],
    currentYear,
  };
}

export default async function NewsHub() {
  const { allNews, currentYear } = await getCachedNewsHubData();

  if (!allNews || allNews.length === 0) {
    return (
      <main className={STYLES.main}>
        <div id="news-header-empty" className="w-full relative">
          <div className={cn(STYLES.sectionContainer, "py-12 md:py-20 lg:py-32")}>
            <PageHero
              title="Tin tức"
              description="Hiện tại chưa có tin tức nào được đăng tải."
            />
          </div>
        </div>
      </main>
    );
  }

  // ItemList schema — same gap /dich-vu had before this pass: /san-pham and
  // /du-an already declared one for their listed items, /tin-tuc never did.
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Tin tức",
    description:
      "Cập nhật những giải pháp kỹ thuật mới nhất và các tin tức chuyên sâu từ đội ngũ kỹ sư ELC",
    url: `${BASE_URL}/tin-tuc`,
    numberOfItems: allNews.length,
    itemListElement: allNews.map((news, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${BASE_URL}/tin-tuc/${news.slug}`,
      name: news.title,
      image: primaryImageUrl(news.images) || undefined,
    })),
  };

  return (
    <main className={STYLES.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdHtml(itemListSchema) }}
      />
      {/* Khối 1: Tiêu đề trang */}
      <div id="news-header" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-6 md:py-8 lg:py-10")}>
          <PageHero
            title="Tin tức"
            description="Cập nhật những giải pháp kỹ thuật mới nhất và các tin tức chuyên sâu từ đội ngũ kỹ sư ELC"
          />
        </div>
      </div>

      {/* Khối 2: Danh sách bài viết */}
      <div id="news-content" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-6 md:py-8 lg:py-10")}>
        <div className="max-w-3xl mx-auto w-full">
          <div className={STYLES.list}>
            {allNews.map((news, index) => {
              const formattedDate = news.createdAt
                ? new Date(news.createdAt).toLocaleDateString("vi-VN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "";

              const excerpt = getExcerptFromContent(
                news.content,
                news.metaDescription,
              );

              return (
                <Link
                  key={news.id}
                  href={`/tin-tuc/${news.slug}`}
                  className={STYLES.article}
                  prefetch={false}
                >
                  <div className={STYLES.textWrapper}>
                    {formattedDate && (
                      <span className={STYLES.date}>{formattedDate}</span>
                    )}
                    <TypographyH2 className={STYLES.articleTitle}>
                      {news.title}
                    </TypographyH2>
                    {excerpt && (
                      <p className={STYLES.articleDescription}>{excerpt}</p>
                    )}
                  </div>

                  {primaryImageUrl(news.images) && (
                    <div className={STYLES.imageWrapper}>
                      <Image
                        src={primaryImageUrl(news.images)!}
                        alt={news.images[0]?.alt || news.title}
                        fill
                        className={STYLES.image}
                        sizes="(max-width: 640px) 144px, (max-width: 768px) 192px, 256px"
                        priority={index === 0}
                      />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      {/* Khối 3: Footer */}
      <div id="news-footer" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-6 md:py-8 lg:py-10")}>
          <footer className={STYLES.footer}>
            <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
            <ScrollToTop className={STYLES.scrollToTop}>
              <TypographySmall>Quay lại đầu trang</TypographySmall>
            </ScrollToTop>
          </footer>
        </div>
      </div>

      {/* Khối 4: Breadcrumbs */}
      <div id="news-breadcrumbs" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-1")}>
          <div className="w-full">
            <Breadcrumbs items={[{ label: "Tin tức", active: true }]} />
          </div>
        </div>
      </div>
    </main>
  );
}
