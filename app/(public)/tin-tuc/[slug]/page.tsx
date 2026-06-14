import { getNews, getNewsBySlug } from "@/modules/news/application";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { DetailPager } from "@/shared/components/layout/user/detail-pager";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import {
  TypographyH1,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { cacheLife, cacheTag } from "next/cache";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// Design System / Style Constants
const STYLES = {
  main: "w-full bg-background min-h-screen",
  title:
    "w-full max-w-none! text-wrap! text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading leading-tight",
  footer:
    "w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground",
};

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}



async function getCachedNewsDetailData(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("news-list", `news-slug:${slug}`);
  setUseStaticClient(true);

  const allNews = await getNews({ isPublished: true });
  const newsItemIndex = (allNews ?? []).findIndex((n) => n.slug === slug);

  if (newsItemIndex === -1) {
    const newsItem = await getNewsBySlug(slug);
    return {
      newsItem,
      prevNews: null,
      nextNews: null,
      relatedNews: [],
      currentYear: new Date().getFullYear(),
    };
  }

  const newsItem = allNews[newsItemIndex];
  const prevNews = newsItemIndex > 0 ? allNews[newsItemIndex - 1] : null;
  const nextNews =
    newsItemIndex < allNews.length - 1 ? allNews[newsItemIndex + 1] : null;

  // Lấy tin tức liên quan theo category_id (nếu có), loại trừ bài hiện tại.
  // Bổ sung các bài viết khác nếu không đủ 3 bài.
  const sameCategoryNews = newsItem.categoryId
    ? allNews.filter(
        (n) => n.categoryId === newsItem.categoryId && n.slug !== slug,
      )
    : [];
  const fallbackNews = allNews.filter(
    (n) => n.slug !== slug && n.categoryId !== newsItem.categoryId,
  );
  const relatedNews = [...sameCategoryNews, ...fallbackNews].slice(0, 3);

  const currentYear = new Date().getFullYear();

  return {
    newsItem,
    prevNews,
    nextNews,
    relatedNews,
    currentYear,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { newsItem } = await getCachedNewsDetailData(slug);

  if (!newsItem) {
    return {
      title: "Không tìm thấy bài viết | ELC",
    };
  }

  const title = newsItem.metaTitle || `${newsItem.title} | Điện máy ELC`;
  const description = newsItem.metaDescription || newsItem.title;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: newsItem.image ? [newsItem.image] : [],
      type: "article",
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch current news detail using the cached helper
  const { newsItem, prevNews, nextNews, relatedNews, currentYear } =
    await getCachedNewsDetailData(slug);

  if (!newsItem || !newsItem.isPublished) {
    notFound();
  }

  const title = newsItem.title || "Tin tức";
  const createdAt = newsItem.createdAt || "";

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": newsItem.title,
    "image": newsItem.image ? [newsItem.image] : [],
    "datePublished": newsItem.createdAt,
    "dateModified": newsItem.updatedAt || newsItem.createdAt,
    "author": {
      "@type": "Organization",
      "name": "Điện máy ELC",
      "url": "https://dienmayelc.com.vn",
    },
    "publisher": {
      "@type": "Organization",
      "name": "Điện máy ELC",
      "logo": {
        "@type": "ImageObject",
        "url": "https://dienmayelc.com.vn/icon.svg",
      },
    },
    "description": newsItem.metaDescription || newsItem.title,
  };

  return (
    <main className={STYLES.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }}
      />
      {/* Khối 1: Chi tiết bài viết */}
      <GridSection
        id="news-detail-content"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-10 md:py-16"
      >
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 animate-fade-in-up">
          <div>
            <Link
              href="/tin-tuc"
              className="group inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              <span>Quay lại danh sách tin tức</span>
            </Link>
            {formattedDate && (
              <TypographySmall className="text-muted-foreground/60 mb-2 block font-medium font-sans">
                {formattedDate}
              </TypographySmall>
            )}
            <TypographyH1 className={STYLES.title}>{title}</TypographyH1>
          </div>
          <article>
            <PreviewContent
              content={newsItem.content}
              hideFirstHeading={true}
            />
          </article>
        </div>
      </GridSection>

      {/* Khối 3: Bài viết liên quan */}
      {relatedNews.length > 0 && (
        <GridSection
          id="news-related"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-10 md:py-16"
        >
          <div className="max-w-3xl mx-auto w-full">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-8 font-heading text-center md:text-left">
              Bài viết liên quan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedNews.map((item) => {
                const itemDate = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "";

                return (
                  <Link
                    key={item.id}
                    href={`/tin-tuc/${item.slug}`}
                    className="group flex flex-col gap-3 no-underline"
                  >
                    {item.image && (
                      <ImageWithSkeleton
                        wrapperClassName="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted"
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 250px"
                      />
                    )}
                    <div className="flex flex-col gap-1.5">
                      {itemDate && (
                        <span className="text-[10px] text-muted-foreground/60 font-medium font-sans">
                          {itemDate}
                        </span>
                      )}
                      <h4 className="text-sm font-semibold tracking-tight text-foreground group-hover:text-foreground/70 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </GridSection>
      )}

      {/* Khối 4: Điều hướng Pager (Trước / Sau) */}
      <GridSection
        id="news-detail-nav"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-8"
      >
        <DetailPager
          prev={
            prevNews
              ? { title: prevNews.title, href: `/tin-tuc/${prevNews.slug}` }
              : null
          }
          next={
            nextNews
              ? { title: nextNews.title, href: `/tin-tuc/${nextNews.slug}` }
              : null
          }
          prevLabel="Bài viết trước"
          nextLabel="Bài viết sau"
        />
      </GridSection>

      {/* Khối 5: Footer bản quyền */}
      <GridSection
        id="news-detail-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <footer className={STYLES.footer}>
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </GridSection>

      {/* Khối 6: Breadcrumbs */}
      <GridSection
        id="news-detail-breadcrumbs"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <div className="w-full">
          <Breadcrumbs
            items={[
              { label: "Tin tức", href: "/tin-tuc" },
              { label: title, active: true },
            ]}
          />
        </div>
      </GridSection>
    </main>
  );
}
