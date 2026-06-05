import {
  CardService,
  getPublishedServicesGrouped,
  mapServiceToCardData,
} from "@/modules/service";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  TypographyH1,
  TypographyLead,
  TypographyP,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";

const STYLES = {
  main: cn("w-full bg-background flex flex-col flex-1"),
  header: cn(
    "flex flex-col gap-6 max-w-2xl w-full mx-auto items-center text-center",
  ),
  title: cn(),
  description: cn(),
  footer: cn(
    "w-full flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

export const metadata = {
  title: "Dịch vụ chuyên nghiệp | Điện máy ELC",
  description:
    "Giải pháp chuyên nghiệp dành cho hệ thống lạnh công nghiệp, điều hòa trung tâm và bảo trì hệ thống.",
};

async function getCachedServicesData() {
  "use cache";
  cacheLife("hours");
  cacheTag("services");
  setUseStaticClient(true);

  const groupedServices = await getPublishedServicesGrouped();
  const currentYear = new Date().getFullYear();

  return {
    groupedServices: groupedServices ?? [],
    currentYear,
  };
}

export default async function ServicesHub() {
  return (
    <Suspense fallback={<ServicesSkeleton />}>
      <ServicesHubContent />
    </Suspense>
  );
}

async function ServicesHubContent() {
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
          <header className={STYLES.header}>
            <TypographyH1 className={STYLES.title}>Dịch vụ</TypographyH1>
            <TypographyP className="text-muted-foreground">
              Hiện tại chưa có dịch vụ nào được đăng tải.
            </TypographyP>
          </header>
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
        <header className={STYLES.header}>
          <TypographyH1 className={STYLES.title}>Dịch vụ</TypographyH1>
          <TypographyLead className={STYLES.description}>
            Giải pháp chuyên nghiệp dành cho hệ thống lạnh công nghiệp, điều hòa
            trung tâm và bảo trì hệ thống.
          </TypographyLead>
        </header>
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
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
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
          <TypographySmall>
            &copy; {currentYear} ELC Holdings. Đã đăng ký bản quyền.
          </TypographySmall>
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

function ServicesSkeleton() {
  return (
    <main className={STYLES.main}>
      <GridSection
        id="services-header-skeleton"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <header className={STYLES.header}>
          <Skeleton className="h-12 w-48 rounded-lg" />
          <Skeleton className="h-6 w-96 max-w-full rounded-md" />
        </header>
      </GridSection>

      <GridSection
        id="services-content-skeleton"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="w-full flex flex-col items-center gap-6">
          {/* Tabs header skeleton */}
          <div className="flex w-full justify-start md:justify-center gap-2 overflow-x-auto mb-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-10 w-28 rounded-md shrink-0" />
            ))}
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 w-full">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="relative mx-auto w-full max-w-sm pt-0 overflow-hidden flex flex-col border border-border/40 rounded-xl bg-white/50 h-[380px]"
              >
                <Skeleton className="aspect-video w-full" />
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <Skeleton className="h-6 w-3/4 rounded" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded" />
                    <Skeleton className="h-5 w-20 rounded" />
                  </div>
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-9 w-full rounded mt-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </GridSection>

      <GridSection
        id="services-footer-skeleton"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <footer className={STYLES.footer}>
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </footer>
      </GridSection>

      <GridSection
        id="services-breadcrumbs-skeleton"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <Skeleton className="h-4 w-32 rounded" />
      </GridSection>
    </main>
  );
}
