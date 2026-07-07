import { getNewsAction } from "@/modules/news/presentation/actions";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import {
  BASE_URL,
  generateBreadcrumbSchema,
  generateSystemPageMetadata,
} from "@/shared/lib/seo-utils";
import type { Metadata } from "next";
import { getCachedSystemPage } from "@/shared/lib/cached-system-page";
import { unwrapActionResult } from "@/shared/lib/action-result";

export async function generateMetadata(): Promise<Metadata> {
  const systemPage = await getCachedSystemPage("tin-tuc");
  return generateSystemPageMetadata(
    systemPage,
    "Tin tức | Điện máy ELC",
    "Cập nhật những giải pháp kỹ thuật mới nhất và các tin tức chuyên sâu từ đội ngũ kỹ sư ELC",
    "/tin-tuc"
  ) as Metadata;
}

const STYLES = {
  main: "w-full bg-background min-h-screen",
  header: "flex flex-col items-center text-center gap-4 max-w-2xl mx-auto",
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

interface TiptapNode {
  type?: string;
  text?: string;
  content?: TiptapNode[];
}

function getExcerptFromContent(
  content: unknown,
  fallbackDescription: string | null | undefined,
): string {
  if (!content) return fallbackDescription || "";

  try {
    let doc: TiptapNode | null = null;

    if (typeof content === "string") {
      const trimmed = content.trim();
      if (trimmed.startsWith("{")) {
        doc = JSON.parse(trimmed) as TiptapNode;
      } else {
        const stripped = content
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (stripped.length > 180) {
          return stripped.substring(0, 180) + "...";
        }
        return stripped || fallbackDescription || "";
      }
    } else if (typeof content === "object" && content !== null) {
      doc = content as TiptapNode;
    }

    if (doc) {
      const textParts: string[] = [];
      const traverse = (node: TiptapNode) => {
        if (node.type === "heading") {
          return;
        }
        if (node.type === "text" && node.text) {
          textParts.push(node.text);
        }
        if (node.content) {
          node.content.forEach(traverse);
        }
      };

      traverse(doc);
      const combinedText = textParts.join(" ").replace(/\s+/g, " ").trim();
      if (combinedText.length > 180) {
        return combinedText.substring(0, 180) + "...";
      }
      return combinedText || fallbackDescription || "";
    }
  } catch (err) {
    console.error("Error parsing news content for excerpt:", err);
  }

  return fallbackDescription || "";
}

async function getCachedNewsHubData() {
  "use cache";
  cacheLife("hours");
  cacheTag("news-list");

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
        <GridSection id="news-header-empty" isFirst={true} showDiamond={true}>
          <header className={STYLES.header}>
            <TypographyH1>Tin tức</TypographyH1>
            <p className="text-muted-foreground">
              Hiện tại chưa có tin tức nào được đăng tải.
            </p>
          </header>
        </GridSection>
      </main>
    );
  }

  return (
    <main className={STYLES.main}>
      {/* Khối 1: Tiêu đề trang */}
      <GridSection
        id="news-header"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <header className={STYLES.header}>
          <TypographyH1>{"Tin tức"}</TypographyH1>
          <TypographyLead>
            Cập nhật những giải pháp kỹ thuật mới nhất và các tin tức chuyên sâu
            từ đội ngũ kỹ sư ELC
          </TypographyLead>
        </header>
      </GridSection>

      {/* Khối 2: Danh sách bài viết */}
      <GridSection
        id="news-content"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
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

                  {news.image && (
                    <ImageWithSkeleton
                      wrapperClassName={STYLES.imageWrapper}
                      src={news.image}
                      alt={news.title}
                      fill
                      className={STYLES.image}
                      sizes="(max-width: 640px) 144px, (max-width: 768px) 192px, 256px"
                      priority={index === 0}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </GridSection>

      {/* Khối 3: Footer */}
      <GridSection
        id="news-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <footer className={STYLES.footer}>
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </GridSection>

      {/* Khối 4: Breadcrumbs */}
      <GridSection
        id="news-breadcrumbs"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <div className="w-full">
          <Breadcrumbs items={[{ label: "Tin tức", active: true }]} />
        </div>
      </GridSection>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateBreadcrumbSchema(
              [{ label: "Tin tức" }],
              `${BASE_URL}/tin-tuc`,
            ),
          ),
        }}
      />
    </main>
  );
}
