import {
  TypographyH1,
  TypographyH4,
  TypographyLead,
  TypographyP,
  TypographySmall,
} from "@/components/ui/typography";
import { ScrollToTop } from "@/components/user/scroll-to-top";
import { generateBreadcrumbSchema, SEO_CONFIG } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thông tin về ELC - Chính sách & Giá trị cốt lõi",
  description:
    "Kho lưu trữ minh bạch về các giá trị cốt lõi, cam kết bảo hành và triết lý kiến tạo của Điện máy ELC.",
  alternates: {
    canonical: "/thong-tin",
  },
};

const STYLES = {
  main: cn("w-full min-h-screen py-12 px-4 md:px-8"),
  container: cn("max-w-5xl mx-auto flex flex-col gap-24"),
  header: cn(
    "flex flex-col gap-6 max-w-2xl w-full mx-auto items-center text-center",
  ),
  title: cn(),
  description: cn(),
  list: cn("grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16"),
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

export default async function InformationHub() {
  const supabase = await createClient();

  // Fetch all published pages
  const { data: allPages } = await supabase
    .from("pages")
    .select("id, title, slug, meta_description, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  if (!allPages) {
    return (
      <main className={STYLES.main}>
        <div className={STYLES.container}>
          <TypographyP className="animate-pulse">
            Đang tải dữ liệu...
          </TypographyP>
        </div>
      </main>
    );
  }

  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Trang chủ", item: "/" },
    { name: "Thông tin", item: "/thong-tin" },
  ]);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: allPages.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SEO_CONFIG.baseUrl}/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <main className={STYLES.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
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
              {/* <div className={STYLES.articleMeta}>
                <TypographySmall className="opacity-30">
                  {new Date(page.created_at).toLocaleDateString("vi-VN", {
                    month: "long",
                    year: "numeric",
                  })}
                </TypographySmall>
              </div> */}

              <div className={STYLES.articleHeader}>
                <TypographyH4 className={STYLES.articleTitle}>
                  {page.title}
                </TypographyH4>
                <ArrowUpRight className={STYLES.articleIcon} />
              </div>

              {page.meta_description && (
                <TypographyP className={STYLES.articleDescription}>
                  {page.meta_description}
                </TypographyP>
              )}

              {/* <div className={STYLES.articleFooter}>
                <TypographySmall className={STYLES.readMore}>
                  Xem thêm
                </TypographySmall>
              </div> */}
            </Link>
          ))}
        </div>

        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {new Date().getFullYear()} ELC Holdings. Đã đăng ký bản
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
