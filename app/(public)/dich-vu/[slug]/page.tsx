import {
  CardService,
  getServiceBySlugAction,
  getPublishedServicesGroupedAction,
  getServicesAction,
  mapServiceToCardData,
  ServiceDetailModule,
} from "@/modules/service";
import {
  generateBreadcrumbSchema,
  generateServiceMetadata,
  generateServiceDetailSchema,
  generateSystemPageMetadata,
} from "@/shared/lib/seo-utils";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { unwrapActionResult } from "@/shared/lib/action-result";
import { DISTRICTS } from "@/shared/lib/districts";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";
import { getCachedSystemPage } from "@/shared/lib/cached-system-page";
import { District } from "@/shared/lib/districts";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dienmayelc.com.vn";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { data: services } = await getServicesAction({ isPublished: true });

  const serviceSlugs = services
    .map((s) => s.slug)
    .filter(Boolean) as string[];
  const districtSlugs = DISTRICTS.map((d) => d.slug);

  return [...serviceSlugs, ...districtSlugs].map((slug) => ({ slug }));
}

// ─── Cached fetchers ────────────────────────────────────────────────────────

async function getCachedService(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag("services-list", `service-slug:${slug}`);
  setUseStaticClient(true);
  // null = khong tim thay (404 that su). Loi mang/Go API se throw va giu
  // nguyen ban cache cu thay vi bi hieu nham la "khong ton tai".
  return getServiceBySlugAction(slug);
}

async function getCachedServicesGrouped() {
  "use cache";
  cacheLife("days");
  cacheTag("services-list");
  setUseStaticClient(true);
  const groupedServices = await getPublishedServicesGroupedAction();
  const currentYear = new Date().getFullYear();
  return { groupedServices: groupedServices ?? [], currentYear };
}

// ─── generateMetadata ────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const district = DISTRICTS.find((d) => d.slug === slug);

  if (district) {
    const systemPage = await getCachedSystemPage("dich-vu");
    const base = generateSystemPageMetadata(
      systemPage,
      `Dịch vụ máy lạnh, thi công HVAC tại ${district.name} | Điện máy ELC`,
      `Giải pháp thi công lắp đặt, bảo trì hệ thống điều hòa chuyên nghiệp tại ${district.name}. Liên hệ ngay để nhận báo giá!`,
      `/dich-vu/${district.slug}`,
    ) as Metadata;
    return {
      ...base,
      alternates: { canonical: `${BASE_URL}/dich-vu/${district.slug}` },
    };
  }

  const service = await getCachedService(slug);
  return generateServiceMetadata(service as unknown as Record<string, unknown>);
}

// ─── FAQ helper for service hub ──────────────────────────────────────────────

function getServiceHubFaq(location: District): Array<{ question: string; answer: string }> {
  const locName = location.name;
  return [
    {
      question: `Điện máy ELC có cung cấp dịch vụ lắp đặt điều hòa tại ${locName} không?`,
      answer: `Có, Điện máy ELC cung cấp đầy đủ các dịch vụ lắp đặt, bảo trì và sửa chữa điều hòa tại ${locName} với đội ngũ kỹ thuật viên giàu kinh nghiệm, hỗ trợ nhanh trong ngày.`,
    },
    {
      question: `Chi phí dịch vụ tại ${locName} có minh bạch không?`,
      answer: `Điện máy ELC báo giá rõ ràng, không phát sinh phí ẩn. Quý khách tại ${locName} sẽ được tư vấn chi phí cụ thể trước khi thực hiện dịch vụ.`,
    },
    {
      question: `Sau khi thi công xong, dịch vụ tại ${locName} có bảo hành không?`,
      answer: `Tất cả dịch vụ đều được bảo hành chất lượng thi công. Nếu phát sinh lỗi kỹ thuật sau thi công tại ${locName}, đội ngũ ELC sẽ xử lý miễn phí theo chính sách bảo hành.`,
    },
  ];
}

// ─── Service Hub with Location ───────────────────────────────────────────────

async function ServiceHubWithLocation({ location }: { location: District }) {
  const { groupedServices, currentYear } = await getCachedServicesGrouped();
  const faqList = getServiceHubFaq(location);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqList.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": { "@type": "Answer", "text": item.answer },
    })),
  };

  const STYLES = {
    main: cn("w-full bg-background flex flex-col flex-1"),
    header: cn("flex flex-col gap-6 max-w-2xl w-full mx-auto items-center text-center"),
    footer: cn("w-full flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground"),
    scrollToTop: cn("flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors"),
  };

  const breadcrumbSchema = generateBreadcrumbSchema(
    [{ label: "Dịch vụ" }],
    `${BASE_URL}/dich-vu/${location.slug}`,
  );

  return (
    <main className={STYLES.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <GridSection
        id="services-header"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <header className={STYLES.header}>
          <TypographyH1>Dịch vụ thi công, lắp đặt & sửa chữa máy lạnh tại {location.name}</TypographyH1>
          <TypographyLead>
            Giải pháp lắp đặt, bảo trì và sửa chữa hệ thống điều hòa chuyên nghiệp tại {location.name}
          </TypographyLead>
        </header>
      </GridSection>

      {groupedServices.length > 0 && (
        <GridSection
          id="services-content"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-6 md:py-8 lg:py-10"
        >
          <Tabs defaultValue={groupedServices[0].name} className="w-full">
            <TabsList className="flex w-full justify-start md:justify-center overflow-x-auto mb-6 h-auto p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {groupedServices.map((group, idx) => (
                <TabsTrigger
                  key={idx}
                  value={group.name}
                  className="shrink-0 px-4 py-2"
                >
                  {group.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {groupedServices.map((group, idx) => (
              <TabsContent key={idx} value={group.name}>
                {group.items.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                    {group.items.map((service) => {
                      const cardProps = mapServiceToCardData(service);
                      return (
                        <CardService
                          key={service.id}
                          {...cardProps}
                          locationSlug={location.slug}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground bg-muted/5">
                    Hiện tại chưa có dịch vụ nào trong nhóm này.
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </GridSection>
      )}

      {/* FAQ */}
      <GridSection
        id="services-faq"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-10 border-t border-border/30"
      >
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <TypographyH2 className="text-xl md:text-2xl font-bold tracking-tight">
            Câu hỏi thường gặp (FAQ)
          </TypographyH2>
          <Accordion type="single" collapsible className="w-full">
            {faqList.map((item, index) => (
              <AccordionItem key={index} value={`faq-item-${index}`}>
                <AccordionTrigger className="text-sm md:text-base font-semibold text-foreground py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </GridSection>

      <GridSection
        id="services-footer"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <footer className={STYLES.footer}>
          <TypographySmall>&copy; {currentYear} Điện máy ELC.</TypographySmall>
          <ScrollToTop className={STYLES.scrollToTop}>
            <TypographySmall>Quay lại đầu trang</TypographySmall>
          </ScrollToTop>
        </footer>
      </GridSection>

      <GridSection
        id="services-breadcrumbs"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <div className="w-full">
          <Breadcrumbs
            items={[
              { label: "Dịch vụ", active: true },
            ]}
          />
        </div>
      </GridSection>
    </main>
  );
}

// ─── Main page handler ───────────────────────────────────────────────────────

export default async function ServiceSlugPage({ params }: PageProps) {
  const { slug } = await params;

  // If slug is a district slug, render service hub with location context
  const district = DISTRICTS.find((d) => d.slug === slug);
  if (district) {
    return <ServiceHubWithLocation location={district} />;
  }

  // Otherwise render service detail
  const service = await getCachedService(slug);
  if (!service) {
    notFound();
  }

  const branches = await getBranchesAction({ isPublished: true }).then(unwrapActionResult);
  const serviceSchema = generateServiceDetailSchema(service, branches);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <ServiceDetailModule service={service} />
    </>
  );
}

