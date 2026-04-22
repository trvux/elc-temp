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
export const dynamic = "force-dynamic";

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
  const { data: services } = await supabase
    .from("services")
    .select("slug")
    .eq("is_published", true);
  return (services ?? []).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createStaticClient();

  const { data: service } = await supabase
    .from("services")
    .select("title, content, meta_title, meta_description, created_at, image")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!service) return { title: "Không tìm thấy nội dung" };

  return {
    title: service.meta_title || `Dịch vụ ${service.title} | ${SEO_CONFIG.siteName}`,
    description:
      service.meta_description || 
      extractMetaDescription(service.content || "", 160),
    alternates: {
      canonical: `${SEO_CONFIG.baseUrl}/dich-vu/${slug}`,
    },
    openGraph: {
      title: service.meta_title || service.title,
      description: service.meta_description || extractMetaDescription(service.content || "", 160),
      url: `${SEO_CONFIG.baseUrl}/dich-vu/${slug}`,
      type: "website",
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createStaticClient();

  // Fetch current service detail
  const { data: service, error } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !service) {
    notFound();
  }

  const schema = generateSchema("Article", { // Using Article schema for service details as they are content-based
    title: service.title || "",
    image: service.image || "",
    datePublished: service.created_at || "",
    dateModified: service.created_at || "",
  });

  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Trang chủ", item: "/" },
    { name: "Dịch vụ", item: "/dich-vu" },
    { name: service.title || "Dịch vụ", item: `/dich-vu/${slug}` },
  ]);

  // Safe date formatting
  let formattedDate = "";
  try {
    if (service.created_at) {
      formattedDate = new Date(service.created_at).toLocaleDateString("vi-VN", {
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
      {/* JSON-LD for Service */}
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
          <TypographyH1 className={STYLES.title}>{service.title}</TypographyH1>
        </header>

        <article>
          <PreviewContent content={service.content} hideFirstHeading={true} />
        </article>

        <nav className={STYLES.footerNav}>
          <Link href="/dich-vu" className={STYLES.backLink}>
            <Button>
              <div className={STYLES.backLabel}>
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                <span>Xem dịch vụ khác</span>
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
