import { Button } from "@/components/ui/button";
import { TypographyH1, TypographySmall } from "@/components/ui/typography";
import { ScrollToTop } from "@/components/user/scroll-to-top";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SEO_CONFIG, extractMetaDescription, generateSchema, generateBreadcrumbSchema } from "@/lib/seo";
import { PreviewContent } from "@/components/user/preview-content";

// Design System / Style Constants
const STYLES = {
  main: cn("w-full min-h-screen py-10 px-4 md:py-20"),
  container: cn("max-w-3xl mx-auto flex flex-col gap-6"),
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
  const supabase = createStaticClient();

  // Fetch current news detail
  const { data: newsItem, error } = await supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

    if (error || !newsItem) {
      redirect("/tin-tuc");
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
          <PreviewContent content={newsItem.content} hideFirstHeading={true} />
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
}
