import { getNews } from "@/modules/news/application";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import {
  TypographyH1,
  TypographyH4,
  TypographyLead,
  TypographyP,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { ArrowUpRight as ArrowIcon } from "@phosphor-icons/react/dist/ssr";
import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";

const STYLES = {
  main: cn("w-full min-h-screen py-12 px-4 md:px-8"),
  container: cn("max-w-5xl mx-auto flex flex-col gap-24"),
  header: cn(
    "flex flex-col gap-6 max-w-2xl w-full mx-auto items-center text-center",
  ),
  title: cn(),
  description: cn(),
  list: cn(
    "grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 min-h-[400px] animate-fade-in-up",
  ),
  article: cn(
    "group flex flex-col gap-6 no-underline transition-all duration-300",
  ),
  imageWrapper: cn(
    "relative aspect-video rounded-2xl overflow-hidden border bg-muted",
  ),
  image: cn(
    "object-cover transition-transform duration-500 group-hover:scale-105",
  ),
  articleHeader: cn("flex justify-between items-start gap-4"),
  articleTitle: cn(
    "text-primary/70 group-hover:text-primary transition-colors",
  ),
  articleIcon: cn(
    "w-6 h-6 shrink-0 mt-2 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all",
  ),
  articleDescription: cn("line-clamp-3 text-muted-foreground"),
  footer: cn(
    "border-t pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

async function getCachedNewsHubData() {
  "use cache";
  cacheLife("hours");
  setUseStaticClient(true);

  const allNews = await getNews({ isPublished: true });
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
        <div className={STYLES.container}>
          <header className={STYLES.header}>
            <TypographyH1 className={STYLES.title}>Tin tức</TypographyH1>
            <TypographyP className="text-muted-foreground">
              Hiện tại chưa có tin tức nào được đăng tải.
            </TypographyP>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className={STYLES.main}>
      <div className={STYLES.container}>
        <header className={STYLES.header}>
          <TypographyH1 className={STYLES.title}>Tin tức</TypographyH1>
          <TypographyLead className={STYLES.description}>
            Cập nhật những giải pháp kỹ thuật mới nhất và các tin tức chuyên sâu
            từ đội ngũ kỹ sư ELC
          </TypographyLead>
        </header>

        <div className={STYLES.list}>
          {allNews.map((news) => (
            <Link
              key={news.id}
              href={`/tin-tuc/${news.slug}`}
              className={STYLES.article}
            >
              {news.image && (
                <div className={STYLES.imageWrapper}>
                  <Image
                    src={news.image}
                    alt={news.title}
                    fill
                    className={STYLES.image}
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className={STYLES.articleHeader}>
                  <TypographyH4 className={STYLES.articleTitle}>
                    {news.title}
                  </TypographyH4>
                  <ArrowIcon className={STYLES.articleIcon} />
                </div>

                <TypographySmall className="text-muted-foreground/40 font-medium">
                  {new Date(news.createdAt).toLocaleDateString("vi-VN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </TypographySmall>
              </div>
            </Link>
          ))}
        </div>

        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {currentYear} ELC Holdings. Đã đăng ký bản quyền.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
