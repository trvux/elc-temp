import { Button } from "@/components/ui/button";
import { TypographyH1, TypographySmall } from "@/components/ui/typography";
import { ScrollToTop } from "@/components/user/scroll-to-top";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SEO_CONFIG, extractMetaDescription, generateSchema, generateBreadcrumbSchema } from "@/lib/seo";

// Design System / Style Constants
export const dynamic = "force-dynamic";

const STYLES = {
  main: cn("w-full min-h-screen py-10 px-4 md:py-20"),
  container: cn("max-w-3xl mx-auto flex flex-col gap-6"),
  title: cn("w-full max-w-none! text-wrap!"),
  prose: cn(
    // 1. Base & Reset
    "prose prose-neutral max-w-none dark:prose-invert",
    "prose-p:m-0 prose-headings:m-0 prose-blockquote:m-0 prose-ul:m-0 prose-ol:m-0 prose-li:m-0",

    // 2. Headings
    "prose-h1:text-4xl prose-h1:font-extrabold prose-h1:tracking-tight prose-h1:leading-tight prose-h1:mb-10",
    "prose-h2:text-3xl prose-h2:font-bold prose-h2:tracking-tight prose-h2:leading-snug prose-h2:mt-16 prose-h2:mb-6",
    "prose-h3:text-2xl prose-h3:font-semibold prose-h3:leading-snug prose-h3:mt-12 prose-h3:mb-4",
    "prose-h4:text-xl prose-h4:font-semibold prose-h4:leading-normal prose-h4:mt-8 prose-h4:mb-2",

    // 3. Paragraph
    "prose-p:text-base md:prose-p:text-lg prose-p:leading-relaxed prose-p:text-foreground/90 prose-p:mb-8 last:prose-p:mb-0",

    // 4. Blockquote
    "prose-blockquote:border-l-4 prose-blockquote:pl-8 prose-blockquote:italic prose-blockquote:text-muted-foreground",
    "prose-blockquote:border-primary/40 prose-blockquote:leading-relaxed prose-blockquote:my-12 prose-blockquote:text-xl",

    // 5. Lists
    "prose-ul:list-disc prose-ol:list-decimal prose-ul:mb-8 prose-ol:mb-8 prose-ul:pl-6",
    "prose-li:leading-relaxed prose-li:mb-3",
    "prose-li:marker:text-primary/60",

    // 6. Media & Tables
    "prose-img:rounded-xl prose-img:my-12",
    "prose-table:my-10 prose-table:leading-normal",
    "prose-th:border-b prose-th:px-4 prose-th:py-4 prose-th:text-left prose-th:font-bold",
    "prose-td:border-b prose-td:px-4 prose-td:py-4 prose-td:text-left",

    // 7. Inline Code
    "prose-code:relative prose-code:rounded prose-code:bg-muted prose-code:px-[0.4rem] prose-code:py-[0.2rem] prose-code:font-mono prose-code:text-sm prose-code:font-semibold prose-code:before:content-[''] prose-code:after:content-['']",

    // 8. Links
    "prose-a:text-foreground prose-a:font-medium prose-a:underline prose-a:underline-offset-4 prose-a:decoration-primary/30 hover:prose-a:decoration-primary transition-all",
  ),
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
  const supabase = createStaticClient();
  const { data: newsList } = await supabase
    .from("news")
    .select("slug")
    .eq("is_published", true);
  return (newsList ?? []).map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createStaticClient();

  const { data: newsItem } = await supabase
    .from("news")
    .select("title, content, image, meta_title, meta_description, created_at, updated_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!newsItem) return { title: "Không tìm thấy nội dung" };

  return {
    title: newsItem.meta_title || newsItem.title,
    description:
      newsItem.meta_description || 
      extractMetaDescription(newsItem.content || "", 160),
    alternates: {
      canonical: `${SEO_CONFIG.baseUrl}/tin-tuc/${slug}`,
    },
    openGraph: {
      title: newsItem.meta_title || newsItem.title,
      description: newsItem.meta_description || extractMetaDescription(newsItem.content || "", 160),
      url: `${SEO_CONFIG.baseUrl}/tin-tuc/${slug}`,
      type: "article",
      images: newsItem.image ? [{ url: newsItem.image }] : [],
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  
  try {
    const supabase = createStaticClient();

    // Fetch current news detail
    const { data: newsItem, error } = await supabase
      .from("news")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) {
      console.error("Database Error:", error);
      throw new Error(`DB_ERROR: ${error.message}`);
    }

    if (!newsItem) {
      notFound();
    }

    const schema = generateSchema("Article", {
      title: newsItem.title || "",
      image: newsItem.image || "",
      datePublished: newsItem.created_at || "",
      dateModified: newsItem.updated_at || newsItem.created_at || "",
    });

    const breadcrumbs = generateBreadcrumbSchema([
      { name: "Trang chủ", item: "/" },
      { name: "Tin tức", item: "/tin-tuc" },
      { name: newsItem.title || "Bài viết", item: `/tin-tuc/${slug}` },
    ]);

    // Safe date formatting
    let formattedDate = "";
    try {
      if (newsItem.created_at) {
        formattedDate = new Date(newsItem.created_at).toLocaleDateString("vi-VN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
    } catch (e) {
      console.error("Date formatting error:", e);
    }

  return (
    <main className={STYLES.main}>
      {/* JSON-LD for News */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      {breadcrumbs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
        />
      )}
      <div className={STYLES.container}>
        <header>
          {formattedDate && (
            <TypographySmall className="text-muted-foreground mb-3 block">
              {formattedDate}
            </TypographySmall>
          )}
          <TypographyH1 className={STYLES.title}>{newsItem.title}</TypographyH1>
        </header>

        <article>
          <div
            className={STYLES.prose}
            dangerouslySetInnerHTML={{
              __html: (newsItem.content || "").replace(
                /<img(\s[^>]*?)?>/gi,
                (_match: string, attrs: string = "") => {
                  // Ensure attrs is treated as a string even if regex match group is undefined
                  const safeAttrs = typeof attrs === "string" ? attrs : "";
                  const a = safeAttrs
                    .replace(/\bloading="[^"]*"/gi, "")
                    .replace(/\bwidth="[^"]*"/gi, "")
                    .replace(/\bheight="[^"]*"/gi, "")
                    .replace(/\balt="[^"]*"/gi, "");
                  return `<img${a} loading="lazy" width="1200" height="800" alt="${newsItem.title || ""}">`;
                },
              ),
            }}
          />
        </article>

        <nav className={STYLES.footerNav}>
          <Link href="/tin-tuc" className={STYLES.backLink}>
            <Button>
              <div className={STYLES.backLabel}>
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                <span>Xem các bài viết khác</span>
              </div>
            </Button>
          </Link>
        </nav>

        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {new Date().getFullYear()} ELC Holdings. Đã đăng ký bản
            quyền.
          </TypographySmall>
          <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
 } catch (error: any) {
  console.error("Critical Page Error:", error);
  // If it's notFound(), re-throw it so Next.js handles the 404
  if (error.digest === "NEXT_NOT_FOUND" || error.message === "NEXT_NOT_FOUND") {
    throw error;
  }

  return (
    <div className="p-20 text-center">
      <h1 className="text-xl font-bold text-destructive mb-4">Lỗi hệ thống (500)</h1>
      <p className="text-muted-foreground mb-4">Đã xảy ra lỗi khi xử lý bài viết này trên Production.</p>
      <div className="text-left bg-muted p-4 rounded-lg inline-block max-w-2xl font-mono text-xs overflow-auto">
        <p>Error: {error.message || "Unknown error"}</p>
        <p>Slug: {slug}</p>
        <p>Time: {new Date().toISOString()}</p>
      </div>
    </div>
  );
 }
}
