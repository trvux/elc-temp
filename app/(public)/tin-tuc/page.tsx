import {
  TypographyH1,
  TypographyH4,
  TypographyLead,
  TypographyP,
  TypographySmall,
} from "@/components/ui/typography";
import { ScrollToTop } from "@/components/user/scroll-to-top";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { generateBreadcrumbSchema, SEO_CONFIG } from "@/lib/seo";

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
  imageWrapper: cn("relative aspect-video rounded-2xl overflow-hidden border bg-muted"),
  image: cn("object-cover transition-transform duration-500 group-hover:scale-105"),
  articleHeader: cn("flex justify-between items-start gap-4"),
  articleTitle: cn("text-primary/70 group-hover:text-primary transition-colors"),
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

export default async function NewsHub() {
  const supabase = await createClient();

  // Fetch all published news
  const { data: allNews } = await supabase
    .from("news")
    .select("id, title, slug, image, meta_description, created_at")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  if (!allNews) {
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
    { name: "Tin tức", item: "/tin-tuc" },
  ]);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": allNews.map((n, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `${SEO_CONFIG.baseUrl}/tin-tuc/${n.slug}`,
      "name": n.title,
      "image": n.image || "",
    }))
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
          <TypographyH1 className={STYLES.title}>Tin tức</TypographyH1>
          <TypographyLead className={STYLES.description}>
            Cập nhật những giải pháp kỹ thuật mới nhất và các tin tức chuyên sâu từ đội ngũ kỹ sư ELC.
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
                  <ArrowUpRight className={STYLES.articleIcon} />
                </div>

                {news.meta_description && (
                  <TypographyP className={STYLES.articleDescription}>
                    {news.meta_description}
                  </TypographyP>
                )}
                
                <TypographySmall className="text-muted-foreground/40 font-medium">
                  {new Date(news.created_at).toLocaleDateString("vi-VN", {
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
