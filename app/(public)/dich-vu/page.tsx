import {
  CardService,
  getPublishedServicesGroupedAction,
  mapServiceToCardData,
} from "@/modules/service";
import { Breadcrumbs } from "@/shared/components/organisms/layout/user/breadcrumbs";
import { ScrollToTop } from "@/shared/components/organisms/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/organisms/sections/grid-section";
import { PageHero } from "@/shared/components/organisms/sections/page-hero";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { TypographySmall } from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";

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
  const { groupedServices, currentYear } = await getCachedServicesData();

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
        {groupedServices.length > 0 && (
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {group.items.map((service) => {
                      const cardProps = mapServiceToCardData(service);
                      return <CardService key={service.id} {...cardProps} />;
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
        )}
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
