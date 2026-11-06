import type { Metadata } from "next";
// Imported by direct path, NOT from "@/modules/service" — see the same
// note in dich-vu/[slug]/page.tsx for why (that barrel's `export *` also
// re-exports the admin ServiceManagement/TiptapEditor chain).
import { CardService } from "@/modules/service/presentation/components/CardService";
import { getPublishedServicesByLineAction } from "@/modules/service/presentation/actions";
import { SERVICE_LINES } from "@/modules/service/domain/line";
import { mapServiceToCardData } from "@/modules/service/domain/mappers";
import { Breadcrumbs } from "@/shared/components/organisms/layout/user/breadcrumbs";
import { ScrollToTop } from "@/shared/components/organisms/layout/user/scroll-to-top";
import { PageHero } from "@/shared/components/organisms/sections/page-hero";
import { BASE_URL, toJsonLdHtml } from "@/shared/lib/seo-schema";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import { cn } from "@/shared/lib/utils";

const HUB_TITLE = "Thi công điều hòa VRV, cấp gió tươi, dịch vụ máy lạnh | ELC";
const HUB_DESCRIPTION =
  "ELC thi công điều hòa trung tâm VRV, cấp gió tươi thu hồi nhiệt, lắp đặt máy lạnh; vệ sinh, sửa chữa, cho thuê, thu cũ đổi mới. Nhắn Zalo để được tư vấn.";

export const metadata: Metadata = {
  title: HUB_TITLE,
  description: HUB_DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/dich-vu` },
};

const STYLES = {
  main: cn("w-full bg-background flex flex-col flex-1"),
  // The old GridSection component (dashed-line + diamond dividers between
  // sections) was removed entirely (2026-09-24) — sections are now
  // separated by plain spacing only. Every section below is a plain div
  // pair sharing this container class, plus its own py-* override.
  sectionContainer: cn(
    "mx-auto h-full w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-12 relative",
  ),
  footer: cn(
    "w-full flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

export default async function ServicesHub() {
  const sections = await getPublishedServicesByLineAction();
  const currentYear = new Date().getFullYear();
  const services = sections.flatMap((section) => section.services);

  if (services.length === 0) {
    return (
      <main className={STYLES.main}>
        <div id="services-header-empty" className="w-full relative">
          <div className={cn(STYLES.sectionContainer, "py-6 md:py-8 lg:py-10")}>
            <PageHero
              title="Dịch vụ"
              description="Hiện tại chưa có dịch vụ nào được đăng tải."
            />
          </div>
        </div>
      </main>
    );
  }

  // ItemList in hub order (main business first), so the structured data lists
  // the same services in the same order as the page.
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Dịch vụ điều hòa và thông gió",
    description: HUB_DESCRIPTION,
    url: `${BASE_URL}/dich-vu`,
    numberOfItems: services.length,
    itemListElement: services.map((service, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${BASE_URL}/dich-vu/${service.slug}`,
      name: service.title,
      image: primaryImageUrl(service.images) || undefined,
    })),
  };

  return (
    <main className={STYLES.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdHtml(itemListSchema) }}
      />
      <div id="services-header" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-6 md:py-8 lg:py-10")}>
          <PageHero
            title="Dịch vụ điều hòa và thông gió"
            description="Từ thi công hệ thống cho công trình đến vệ sinh, sửa chữa và cho thuê máy lạnh. Chọn đúng việc, nhắn Zalo để được tư vấn."
          />
        </div>
      </div>

      {sections.map(({ line, services: lineServices }) => {
        const info = SERVICE_LINES[line];
        return (
          <section
            key={line}
            id={`services-${line}`}
            aria-labelledby={`services-${line}-heading`}
            className="w-full relative"
          >
            <div className={cn(STYLES.sectionContainer, "py-6 md:py-8 lg:py-10")}>
              <div className="mb-6 flex max-w-3xl flex-col gap-2 md:mb-8">
                <h2 id={`services-${line}-heading`} className="type-title">
                  {info.label}
                </h2>
                <p className="type-body text-muted-foreground">{info.hubIntro}</p>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {lineServices.map((service) => {
                  const cardProps = mapServiceToCardData(service);
                  return (
                    <li key={service.id} className="flex flex-col">
                      <CardService {...cardProps} headingAs="h3" />
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}

      <div id="services-footer" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-6 md:py-8 lg:py-10")}>
          <footer className={STYLES.footer}>
            <small className="type-caption">&copy; {currentYear} Điện máy ELC.</small>
            <ScrollToTop className={STYLES.scrollToTop}>
              <small className="type-caption">Quay lại đầu trang</small>
            </ScrollToTop>
          </footer>
        </div>
      </div>

      <div id="services-breadcrumbs" className="w-full relative">
        <div className={cn(STYLES.sectionContainer, "py-1")}>
          <div className="w-full">
            <Breadcrumbs items={[{ label: "Dịch vụ", active: true }]} />
          </div>
        </div>
      </div>
    </main>
  );
}
