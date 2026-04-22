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
  const { data: pages } = await supabase
    .from("pages")
    .select("slug")
    .eq("is_published", true);
  return (pages ?? []).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("title, content, meta_title, meta_description, created_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!page) return { title: "Không tìm thấy nội dung" };

  return {
    title: page.meta_title || `${page.title} | ${SEO_CONFIG.siteName}`,
    description:
      page.meta_description || 
      extractMetaDescription(page.content || "", 160),
    alternates: {
      canonical: `${SEO_CONFIG.baseUrl}/${slug}`,
    },
    openGraph: {
      title: page.meta_title || page.title,
      description: page.meta_description || extractMetaDescription(page.content || "", 160),
      url: `${SEO_CONFIG.baseUrl}/${slug}`,
      type: "website",
    },
  };
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch current page content
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!page) {
    notFound();
  }

  const schema = generateSchema("Article", { // Using Article schema for info pages
    title: page.title,
    datePublished: page.created_at,
    dateModified: page.created_at,
  });

  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Trang chủ", item: "/" },
    { name: "Thông tin", item: "/thong-tin" },
    { name: page.title, item: `/${slug}` },
  ]);

  return (
    <main className={STYLES.main}>
      {/* JSON-LD for Page */}
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
          <TypographySmall className="text-muted-foreground mb-3 block">
            {new Date(page.created_at).toLocaleDateString("vi-VN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </TypographySmall>
          <TypographyH1 className={STYLES.title}>{page.title}</TypographyH1>
        </header>

        <article>
          <PreviewContent content={page.content} />
        </article>

        <nav className={STYLES.footerNav}>
          <Link href="/thong-tin" className={STYLES.backLink}>
            <Button>
              <div className={STYLES.backLabel}>
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                <span>Quay lại danh mục</span>
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
