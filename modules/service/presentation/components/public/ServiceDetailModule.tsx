import { getContactsAction } from "@/modules/contact/presentation/actions";
import { TrackView } from "@/modules/event";
import { LeadForm } from "@/modules/inquiry/presentation/components/LeadForm";
import { getAdjacentServicesAction } from "@/modules/service/presentation/actions";
import { ServiceWithRelations } from "@/modules/service/domain/types";
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
import Image from "next/image";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  TypographyH1,
  TypographyLarge,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { cn, formatCurrency } from "@/shared/lib/utils";

interface ServiceDetailModuleProps {
  service: ServiceWithRelations;
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

async function getCachedServiceDetailModuleData() {
  const { data: rawContacts } = await getContactsAction();
  const contacts = (rawContacts || []).filter((c) => c.isActive);

  return {
    contacts,
    currentYear: new Date().getFullYear(),
  };
}

export async function ServiceDetailModule({
  service,
}: ServiceDetailModuleProps) {
  const { contacts, currentYear } = await getCachedServiceDetailModuleData();
  const { prev, next } = await getAdjacentServicesAction(service);

  const images = service.images || [];
  const finalPrice = service.salePrice || service.originalPrice;

  return (
    <main className={STYLES.main}>
      <TrackView entityType="service" entityId={service.id} entityName={service.title} />
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
                      images.map((img, i) => (
                        <CarouselItem key={i}>
                          <AspectRatio ratio={16 / 9}>
                            <Image
                              src={img.url}
                              alt={img.alt || `${service.title} - Điện máy ELC`}
                              fill
                              className={STYLES.carouselImage}
                              priority={i === 0}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
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
                {service.title}
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
                  <TypographyLarge className={STYLES.price}>
                    {service.priceDisplayText}
                  </TypographyLarge>
                ) : (
                  <>
                    <TypographyLarge className={STYLES.price}>
                      {formatCurrency(finalPrice)}
                    </TypographyLarge>
                    {(service.discountPercent || 0) > 0 && (
                      <div className={STYLES.originalPriceWrapper}>
                        <TypographySmall className={STYLES.originalPrice}>
                          {formatCurrency(service.originalPrice)}
                        </TypographySmall>
                        <Badge variant="destructive">
                          Giảm giá: {service.discountPercent}%
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <OrderButton contacts={contacts || []} />
                <LeadForm serviceId={service.id} entityName={service.title} entityKind="service" />
              </div>
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
            items={[
              { label: "Dịch vụ", href: "/dich-vu" },
              { label: service.title, active: true },
            ]}
          />
        </div>
      </GridSection>
    </main>
  );
}
