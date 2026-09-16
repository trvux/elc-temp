import type { Metadata } from "next";
import {
  CardService,
  getPublishedServicesGroupedAction,
  mapServiceToCardData,
} from "@/modules/service";
import { Breadcrumbs } from "@/shared/components/organisms/layout/user/breadcrumbs";
import { ScrollToTop } from "@/shared/components/organisms/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/organisms/sections/grid-section";
import { PageHero } from "@/shared/components/organisms/sections/page-hero";
import { Separator } from "@/shared/components/ui/separator";
import { TypographySmall } from "@/shared/components/ui/typography";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { cn } from "@/shared/lib/utils";

export const metadata: Metadata = {
  title: "Dịch vụ máy lạnh & hệ thống khí tươi | Điện máy ELC",
  description:
    "Giải pháp chuyên nghiệp cho hệ thống lạnh công nghiệp, điều hòa trung tâm và bảo trì hệ thống — lắp đặt, sửa chữa, vệ sinh, bảo trì máy lạnh.",
  alternates: { canonical: `${BASE_URL}/dich-vu` },
};

const STYLES = {
  main: cn("w-full bg-background flex flex-col flex-1"),
  footer: cn(
    "w-full flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

async function getCachedServicesData() {
  const groupedServices = await getPublishedServicesGroupedAction();
  const currentYear = new Date().getFullYear();

  return {
    groupedServices: groupedServices ?? [],
    currentYear,
  };
}

export default async function ServicesHub() {
  const { groupedServices: allGroups, currentYear } =
    await getCachedServicesData();
  const groupedServices = (allGroups ?? []).filter(
    (group) => group.items.length > 0,
  );

  if (!groupedServices || groupedServices.length === 0) {
    return (
      <main className={STYLES.main}>
        <GridSection
          id="services-header-empty"
          isFirst={true}
          showDiamond={true}
          contentClassName="py-6 md:py-8 lg:py-10"
        >
          <PageHero
            title="Dịch vụ"
            description="Hiện tại chưa có dịch vụ nào được đăng tải."
          />
        </GridSection>
      </main>
    );
  }

  return (
    <main className={STYLES.main}>
      <GridSection
        id="services-header"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <PageHero
          title="Dịch vụ"
          description="Giải pháp chuyên nghiệp dành cho hệ thống lạnh công nghiệp, điều hòa trung tâm và bảo trì hệ thống"
        />
      </GridSection>

      <GridSection
        id="services-content"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="flex flex-col gap-8">
          {groupedServices.map((group, idx) => (
            <div key={group.name} className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground font-heading">
                  {group.name}
                </h2>
                <span className="text-xs text-muted-foreground shrink-0">
                  {group.items.length} dịch vụ
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {group.items.map((service) => {
                  const cardProps = mapServiceToCardData(service);
                  return <CardService key={service.id} {...cardProps} />;
                })}
              </div>
              {idx < groupedServices.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
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
          <Breadcrumbs items={[{ label: "Dịch vụ", active: true }]} />
        </div>
      </GridSection>
    </main>
  );
}
