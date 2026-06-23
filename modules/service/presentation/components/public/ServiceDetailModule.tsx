import { getContactHref } from "@/modules/contact";
import { getAdjacentServices } from "@/modules/service/application";
import { ServiceWithRelations } from "@/modules/service/domain/types";
import { serviceRepo } from "@/modules/service/infrastructure/serviceRepo";
import { Breadcrumbs } from "@/shared/components/layout/user/breadcrumbs";
import { DetailPager } from "@/shared/components/layout/user/detail-pager";
import { OrderButton } from "@/shared/components/layout/user/order-button";
import { ProductDescription } from "@/shared/components/layout/user/product-description";
import RelatedServices from "@/shared/components/layout/user/related-services";
import { ScrollToTop } from "@/shared/components/layout/user/scroll-to-top";
import { GridSection } from "@/shared/components/sections/grid-section";
import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Badge } from "@/shared/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/shared/components/ui/carousel";
import { ImageWithSkeleton } from "@/shared/components/ui/image-with-skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  TypographyH1,
  TypographyH3,
  TypographyH4,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { createClient, setUseStaticClient } from "@/shared/lib/supabase/server";
import { cn, formatCurrency } from "@/shared/lib/utils";
import { cacheLife, cacheTag } from "next/cache";

import { District } from "@/shared/lib/districts";

interface ServiceDetailModuleProps {
  service: ServiceWithRelations;
  location?: District;
}

const STYLES = {
  main: cn("w-full bg-background min-h-screen flex flex-col"),
  topSection: cn(
    "grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start",
  ),
  imageArea: cn("space-y-4"),
  carouselWrapper: cn(
    "w-full bg-white border border-border/50 rounded-2xl overflow-hidden shadow-sm",
  ),
  carouselImage: cn("object-contain p-4"),
  noImage: cn(
    "w-full h-full flex items-center justify-center text-muted-foreground text-xs tracking-widest",
  ),
  infoArea: cn("flex flex-col gap-4 h-full justify-center"),
  serviceName: cn(
    "w-full max-w-none text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight wrap-break-word leading-[1.15]",
  ),
  subInfo: cn("flex flex-col gap-3"),
  priceArea: cn("space-y-2"),
  price: cn("text-3xl md:text-4xl font-bold text-foreground tracking-tight"),
  originalPriceWrapper: cn("flex items-center gap-2"),
  originalPrice: cn("text-md text-muted-foreground line-through"),

  tabsListWrapper: cn("mx-auto w-fit"),
  tabsContent: cn("pt-10 focus-visible:outline-none"),
  descriptionWrapper: cn("max-w-4xl mx-auto"),
  footer: cn(
    "w-full flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground",
  ),
  scrollToTop: cn(
    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
  ),
};

async function getCachedServiceDetailModuleData(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag("services-list", `service-slug:${slug}`);
  setUseStaticClient(true);

  const supabase = await createClient();

  const { data: rawContacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("is_active", true)
    .order("order_index");

  const contacts = (rawContacts || []).map((row) => {
    const href = getContactHref(row.type || "", row.value || "");
    return {
      id: row.id,
      type: row.type || "",
      label: row.label || null,
      value: row.value || "",
      isActive: row.is_active ?? true,
      orderIndex: row.order_index || 0,
      href,
      isExternal: !href.startsWith("tel:") && !href.startsWith("mailto:"),
    };
  });

  return {
    contacts,
    currentYear: new Date().getFullYear(),
  };
}

export async function ServiceDetailModule({
  service,
  location,
}: ServiceDetailModuleProps) {
  const { contacts, currentYear } = await getCachedServiceDetailModuleData(
    service.slug,
  );
  const { prev, next } = await getAdjacentServices(serviceRepo, service);

  const images = service.image ? [service.image] : [];
  const finalPrice = service.salePrice || service.originalPrice;

  return (
    <main className={STYLES.main}>
      {/* ===== SECTION 1: IMAGE + SERVICE INFO ===== */}
      <GridSection
        id="service-detail-top"
        isFirst={true}
        showDiamond={true}
        contentClassName="py-6 md:py-8 lg:py-10"
      >
        <div className="w-full animate-fade-in-up">
          <div className={STYLES.topSection}>
            <div className={STYLES.imageArea}>
              <div className={STYLES.carouselWrapper}>
                <Carousel className="w-full">
                  <CarouselContent>
                    {images.length > 0 ? (
                      images.map((img: string, i: number) => (
                        <CarouselItem key={i}>
                          <AspectRatio ratio={16 / 9}>
                            <ImageWithSkeleton
                              src={img}
                              alt={location ? `${service.title} tại ${location.name} - Điện máy ELC` : `${service.title} - Điện máy ELC`}
                              fill
                              className={STYLES.carouselImage}
                              priority={i === 0}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                              wrapperClassName="w-full h-full"
                            />
                          </AspectRatio>
                        </CarouselItem>
                      ))
                    ) : (
                      <CarouselItem>
                        <AspectRatio ratio={4 / 3}>
                          <div className={STYLES.noImage}>Chưa có ảnh</div>
                        </AspectRatio>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                </Carousel>
              </div>
            </div>

            <div className={STYLES.infoArea}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {service.group?.name && (
                  <Badge variant="secondary">{service.group.name}</Badge>
                )}
                {service.category?.name && (
                  <TypographySmall className="text-muted-foreground">
                    {service.category.name}
                  </TypographySmall>
                )}
              </div>

              <TypographyH1 className={STYLES.serviceName}>
                {location ? `${service.title} tại ${location.name}` : service.title}
              </TypographyH1>

              {service.labels && service.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {service.labels.map((label: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {label}
                    </Badge>
                  ))}
                </div>
              )}

              {service.description && (
                <TypographySmall className="text-muted-foreground leading-relaxed">
                  {service.description}
                </TypographySmall>
              )}

              <div className={STYLES.priceArea}>
                {service.priceDisplayText ? (
                  <TypographyH3 className={STYLES.price}>
                    {service.priceDisplayText}
                  </TypographyH3>
                ) : (
                  <>
                    <TypographyH3 className={STYLES.price}>
                      {formatCurrency(finalPrice)}
                    </TypographyH3>
                    {(service.discountPercent || 0) > 0 && (
                      <div className={STYLES.originalPriceWrapper}>
                        <TypographyH4 className={STYLES.originalPrice}>
                          {formatCurrency(service.originalPrice)}
                        </TypographyH4>
                        <Badge variant="destructive">
                          Giảm giá: {service.discountPercent}%
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </div>

              <OrderButton contacts={contacts || []} />
            </div>
          </div>
        </div>
      </GridSection>

      {/* ===== SECTION 2: SERVICE DESCRIPTION TABS ===== */}
      {service.content && (
        <GridSection
          id="service-detail-tabs"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-6 md:py-8 lg:py-10"
        >
          <div className="w-full">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className={STYLES.tabsListWrapper}>
                <TabsTrigger value="description">Chi tiết dịch vụ</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className={STYLES.tabsContent}>
                <div className={STYLES.descriptionWrapper}>
                  <ProductDescription content={service.content} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </GridSection>
      )}

      {/* ===== SECTION 3: SERVICE PAGER ===== */}
      {(prev || next) && (
        <GridSection
          id="service-detail-pager"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-6 md:py-8 lg:py-10"
        >
          <DetailPager
            prevLabel="Dịch vụ trước"
            nextLabel="Dịch vụ tiếp theo"
            prev={
              prev ? { title: prev.title, href: `/dich-vu/${prev.slug}` } : null
            }
            next={
              next ? { title: next.title, href: `/dich-vu/${next.slug}` } : null
            }
          />
        </GridSection>
      )}

      {/* ===== SECTION 4: RELATED SERVICES ===== */}
      {service.groupId && (
        <GridSection
          id="service-detail-related"
          isFirst={false}
          showDiamond={true}
          contentClassName="py-6 md:py-8 lg:py-10"
        >
          <div className="w-full">
            <RelatedServices
              groupId={service.groupId}
              currentServiceId={service.id}
            />
          </div>
        </GridSection>
      )}

      {/* ===== SECTION 5: FOOTER ===== */}
      <GridSection
        id="service-detail-footer"
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

      {/* ===== SECTION 6: BREADCRUMBS ===== */}
      <GridSection
        id="service-detail-breadcrumbs"
        isFirst={false}
        showDiamond={false}
        contentClassName="py-1"
      >
        <div className="w-full">
          <Breadcrumbs
            items={location ? [
              { label: "Dịch vụ", href: "/dich-vu" },
              { label: service.title, href: `/dich-vu/${service.slug}` },
              { label: `${service.title} tại ${location.name}`, active: true },
            ] : [
              { label: "Dịch vụ", href: "/dich-vu" },
              { label: service.title, active: true },
            ]}
          />
        </div>
      </GridSection>
    </main>
  );
}
