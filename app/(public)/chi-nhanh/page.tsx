import {
  TypographyH1,
  TypographyH3,
  TypographyLead,
  TypographyP,
  TypographySmall,
} from "@/components/ui/typography";
import { ScrollToTop } from "@/components/user/scroll-to-top";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { generateBreadcrumbSchema, SEO_CONFIG } from "@/lib/seo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Hệ thống Chi nhánh | ${SEO_CONFIG.siteName}`,
  description: "Danh sách hệ thống chi nhánh, trạm dịch vụ và văn phòng đại diện của Điện máy ELC trên toàn quốc.",
  alternates: {
    canonical: `${SEO_CONFIG.baseUrl}/chi-nhanh`,
  },
  openGraph: {
    title: `Hệ thống Chi nhánh | ${SEO_CONFIG.siteName}`,
    description: "Tìm kiếm chi nhánh Điện máy ELC gần nhất để nhận giải pháp không khí chuyên nghiệp.",
    url: `${SEO_CONFIG.baseUrl}/chi-nhanh`,
    type: "website",
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
  articleHeader: cn("flex justify-between items-start gap-4"),
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

export default async function BranchesHub() {
  const supabase = await createClient();

  // Fetch all published branches
  const { data: allBranches } = await supabase
    .from("branches")
    .select("id, name, slug, address")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  if (!allBranches) {
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
    { name: "Chi nhánh", item: "/chi-nhanh" },
  ]);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": allBranches.map((b, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `${SEO_CONFIG.baseUrl}/chi-nhanh/${b.slug}`,
      "name": b.name,
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
          <TypographyH1 className={STYLES.title}>Cơ sở hạ tầng</TypographyH1>
          <TypographyLead className={STYLES.description}>
            Hệ thống không gian trưng bày và trạm dịch vụ của ELC được mở rộng
            trên toàn quốc với triết lý kiến tạo giá trị đồng nhất.
          </TypographyLead>
        </header>

        <div className={STYLES.list}>
          {allBranches.map((branch) => (
            <Link
              key={branch.id}
              href={`/chi-nhanh/${branch.slug}`}
              className={STYLES.article}
            >
              <div className={STYLES.articleHeader}>
                <TypographyH3 className={STYLES.articleTitle}>
                  {branch.name}
                </TypographyH3>
                <ArrowUpRight className={STYLES.articleIcon} />
              </div>

              {/* {branch.address && (
                <TypographyP className={STYLES.articleDescription}>
                  {branch.address}
                </TypographyP>
              )} */}
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
