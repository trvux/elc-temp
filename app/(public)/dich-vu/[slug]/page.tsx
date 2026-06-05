import { Button } from "@/shared/components/ui/button";
import { TypographyH1, TypographySmall } from "@/shared/components/ui/typography";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { createStaticClient } from "@/shared/lib/supabase/static";
import { cn } from "@/shared/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { generateServiceMetadata } from "@/shared/lib/seo-utils";
import { Metadata } from "next";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife } from "next/cache";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Cached service fetcher to share between generateMetadata and Page
async function getCachedService(slug: string) {
  "use cache";
  cacheLife("hours");
  setUseStaticClient(true);

  const supabase = createStaticClient();
  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .maybeSingle();

  return service;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getCachedService(slug);
  return generateServiceMetadata(service);
}

const STYLES = {
  main: cn("w-full min-h-screen py-10 px-4 md:py-20"),
  container: cn("max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in-up"),
  title: cn("w-full max-w-none! text-wrap!"),
  footerNav: "mt-10",
  backLink: "group inline-flex items-center",
  backLabel: "flex items-center gap-2",
  footer:
    "mt-10 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-10 text-muted-foreground",
};

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data: services } = await supabase
    .from("services")
    .select("slug")
    .eq("is_published", true)
    .is("deleted_at", null);
  const params = (services ?? []).map((s) => ({ slug: s.slug }));
  if (params.length === 0) {
    return [{ slug: "preview-stub" }];
  }
  return params;
}

async function getCachedCurrentYear() {
  "use cache";
  return new Date().getFullYear();
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getCachedService(slug);

  if (!service) {
    notFound();
  }

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

  const currentYear = await getCachedCurrentYear();

  return (
    <main className={STYLES.main}>
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
          <Button asChild>
            <Link href="/dich-vu" className={STYLES.backLink}>
              <div className={STYLES.backLabel}>
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                <span>Xem dịch vụ khác</span>
              </div>
            </Link>
          </Button>
        </nav>

        <footer className={STYLES.footer}>
          <TypographySmall>
            &copy; {currentYear} ELC Holdings. Đã đăng ký bản
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
