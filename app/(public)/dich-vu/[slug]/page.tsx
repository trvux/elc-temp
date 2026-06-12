import { getServiceBySlug, getServices } from "@/modules/service/application";
import { PreviewContent } from "@/shared/components/layout/user/preview-content";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { Button } from "@/shared/components/ui/button";
import {
  TypographyH1,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { generateServiceMetadata } from "@/shared/lib/seo-utils";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Cached service fetcher to share between generateMetadata and Page
async function getCachedService(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag("services");
  setUseStaticClient(true);

  return getServiceBySlug(slug);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getCachedService(slug);
  return generateServiceMetadata(service as unknown as Record<string, unknown>);
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
  const services = await getServices({ isPublished: true });
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
    if (service.createdAt) {
      formattedDate = new Date(service.createdAt).toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  } catch (e) {
    console.error("Date formatting error:", e);
  }

  const currentYear = await getCachedCurrentYear();

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.title,
    "description": service.metaDescription || service.title,
    "provider": {
      "@type": "HVACBusiness",
      "name": "Điện máy ELC",
      "url": "https://dienmayelc.com.vn",
      "telephone": "+84789978898",
      "image": "https://dienmayelc.com.vn/opengraph-image.png",
      "priceRange": "$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "06 Dương Quảng Hàm, phường An Nhơn",
        "addressLocality": "Gò Vấp",
        "addressRegion": "Thành phố Hồ Chí Minh",
        "addressCountry": "VN",
      },
    },
    "areaServed": [
      {
        "@type": "AdministrativeArea",
        "name": "Thành phố Hồ Chí Minh",
      },
      {
        "@type": "AdministrativeArea",
        "name": "Bình Dương",
      },
      {
        "@type": "AdministrativeArea",
        "name": "Đồng Nai",
      },
    ],
  };

  return (
    <main className={STYLES.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
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

        <Breadcrumbs
          items={[
            { label: "Dịch vụ", href: "/dich-vu" },
            { label: service.title, active: true },
          ]}
        />

        <footer className={STYLES.footer}>
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
