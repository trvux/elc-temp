import {
  TypographyH1,
  TypographyH4,
  TypographyLead,
  TypographyP,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { cn } from "@/shared/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getPages } from "@/modules/page/application";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife } from "next/cache";


const STYLES = {
  main: cn("w-full min-h-screen py-12 px-4 md:px-8"),
  container: cn("max-w-5xl mx-auto flex flex-col gap-24"),
  header: cn(
    "flex flex-col gap-6 max-w-2xl w-full mx-auto items-center text-center",
  ),
  title: cn(),
  description: cn(),
  list: cn("grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 min-h-[400px] animate-fade-in-up"),
  article: cn(
    "group flex flex-col gap-6 no-underline transition-all duration-300",
  ),
  articleHeader: cn("flex justify-between items-start gap-4 "),
  articleMeta: cn(""),
  articleTitle: cn("text-primary/70 group-hover:text-primary"),
  articleIcon: cn(
    "w-6 h-6 shrink-0 mt-2 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all",
  ),
  articleDescription: cn(),
  articleFooter: cn(""),
  readMore: cn(""),
  footer: cn(
    "border-t pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

async function getCachedInformationData() {
  "use cache";
  cacheLife("hours");
  setUseStaticClient(true);

  const allPages = await getPages({ isPublished: true });
  const currentYear = new Date().getFullYear();

  return {
    allPages: allPages ?? [],
    currentYear,
  };
}

export default async function InformationHub() {
  const { allPages, currentYear } = await getCachedInformationData();

  if (!allPages || allPages.length === 0) {
    return (
      <main className={STYLES.main}>
        <div className={STYLES.container}>
          <header className={STYLES.header}>
            <TypographyH1 className={STYLES.title}>Thông tin về ELC</TypographyH1>
            <TypographyP className="text-muted-foreground">
              Hiện tại chưa có thông tin nào được cập nhật.
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
          <TypographyH1 className={STYLES.title}>Thông tin về ELC</TypographyH1>
          <TypographyLead className={STYLES.description}>
            Kho lưu trữ minh bạch về các giá trị cốt lõi, cam kết bảo hành và
            triết lý kiến tạo.
          </TypographyLead>
        </header>

        <div className={STYLES.list}>
          {allPages.map((page) => (
            <Link
              key={page.id}
              href={`/${page.slug}`}
              className={STYLES.article}
            >
              <div className={STYLES.articleHeader}>
                <TypographyH4 className={STYLES.articleTitle}>
                  {page.title}
                </TypographyH4>
                <ArrowUpRight className={STYLES.articleIcon} />
              </div>
            </Link>
          ))}
        </div>

        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {currentYear} ELC Holdings. Đã đăng ký bản
            quyền.
          </TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
