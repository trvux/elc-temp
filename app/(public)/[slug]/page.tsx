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
const STYLES = {
  main: cn("w-full min-h-screen py-10 px-4 md:py-20"),
  container: cn("max-w-3xl mx-auto flex flex-col gap-6"),
  title: cn("w-full max-w-none! text-wrap!"),
  // prose: cn(
  //   // 1. Reset & Base (Loại bỏ khoảng cách mặc định của thư viện prose)
  //   "prose prose-neutral max-w-none dark:prose-invert",
  //   "prose-p:my-2 prose-headings:my-2 prose-headings:mt-6 prose-blockquote:my-6 prose-ul:my-2 prose-ol:my-2 prose-li:my-2",
  //   "prose-img:my-2 prose-table:my-2",

  //   // 2. Typography H1 (Dựa trên TypographyH1)
  //   "prose-h1:scroll-m-20 prose-h1:text-4xl prose-h1:font-extrabold prose-h1:tracking-tight prose-h1:text-balance",

  //   // 3. Typography H2 (Dựa trên TypographyH2)
  //   "prose-h2:scroll-m-20 prose-h2:text-3xl prose-h2:font-semibold prose-h2:tracking-tight prose-h2:border-b-0",

  //   // 4. Typography H3 & H4
  //   "prose-h3:scroll-m-20 prose-h3:text-2xl prose-h3:font-semibold prose-h3:tracking-tight",
  //   "prose-h4:scroll-m-20 prose-h4:text-xl prose-h4:font-semibold prose-h4:tracking-tight",

  //   // 5. Paragraph & Lead (Dựa trên TypographyP)
  //   "prose-p:leading-7 prose-p:text-foreground/90",

  //   // 6. Blockquote (Dựa trên TypographyBlockquote)
  //   "prose-blockquote:border-l-2 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-muted-foreground",
  //   "prose-blockquote:border-foreground/20",

  //   // 7. Table (Dựa trên TypographyTable & TableCell)
  //   "prose-th:border prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-bold",
  //   "prose-td:border prose-td:px-4 prose-td:py-2 prose-td:text-left",

  //   // 8. Lists (Dựa trên TypographyList)
  //   "prose-ul:list-disc prose-ol:list-decimal",
  //   "prose-li:leading-7",
  //   "prose-li:marker:text-foreground/80",

  //   // 9. Inline Code (Dựa trên TypographyInlineCode)
  //   "prose-code:relative prose-code:rounded prose-code:bg-muted prose-code:px-[0.3rem] prose-code:py-[0.2rem] prose-code:font-mono prose-code:text-sm prose-code:font-semibold prose-code:before:content-[''] prose-code:after:content-['']",

  //   // 10. Custom (Giữ lại vẻ cao cấp cho link)
  //   "prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:text-primary/80 transition-colors",
  // ),
  prose: cn(
    // 1. Base & Reset
    // max-w-none để mày tự kiểm soát layout ngoài wrapper
    "prose prose-neutral max-w-none dark:prose-invert",
    // Reset toàn bộ margin để kiểm soát nhịp điệu dọc bằng mb (margin-bottom)
    "prose-p:m-0 prose-headings:m-0 prose-blockquote:m-0 prose-ul:m-0 prose-ol:m-0 prose-li:m-0",

    // 2. Headings - Khử dính bằng cách siết Leading tight và tăng Margin bottom
    // H1: Cực to, cực đậm, leading chặt (tight = 1.25)
    "prose-h1:text-4xl prose-h1:font-extrabold prose-h1:tracking-tight prose-h1:leading-tight prose-h1:mb-10",

    // H2: Phân đoạn rõ ràng, mt to để tạo khoảng nghỉ khi cuộn trang
    "prose-h2:text-3xl prose-h2:font-bold prose-h2:tracking-tight prose-h2:leading-snug prose-h2:mt-16 prose-h2:mb-6",

    // H3 & H4: Nhỏ dần nhưng vẫn phải giữ khoảng cách
    "prose-h3:text-2xl prose-h3:font-semibold prose-h3:leading-snug prose-h3:mt-12 prose-h3:mb-4",
    "prose-h4:text-xl prose-h4:font-semibold prose-h4:leading-normal prose-h4:mt-8 prose-h4:mb-2",

    // 3. Paragraph - Linh hồn của sự "thoáng"
    // Sử dụng leading-relaxed (1.625) để dòng chữ không bị dính vào nhau
    "prose-p:text-base md:prose-p:text-lg prose-p:leading-relaxed prose-p:text-foreground/90 prose-p:mb-8 last:prose-p:mb-0",

    // 4. Blockquote - Nhấn mạnh nhưng vẫn phải dễ đọc
    "prose-blockquote:border-l-4 prose-blockquote:pl-8 prose-blockquote:italic prose-blockquote:text-muted-foreground",
    "prose-blockquote:border-primary/40 prose-blockquote:leading-relaxed prose-blockquote:my-12 prose-blockquote:text-xl",

    // 5. Lists - Tăng khoảng cách li để không bị thành một cục chữ
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

    // 8. Links - Tinh tế kiểu hiện đại
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
          <div
            className={STYLES.prose}
            dangerouslySetInnerHTML={{
              __html: (page.content || "").replace(
                /<img(\s[^>]*?)?>/gi,
                (_match: string, attrs: string = "") => {
                  const a = attrs
                    .replace(/\bloading="[^"]*"/gi, "")
                    .replace(/\bwidth="[^"]*"/gi, "")
                    .replace(/\bheight="[^"]*"/gi, "");
                  return `<img${a} loading="lazy" width="1200" height="800">`;
                },
              ),
            }}
          />
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
