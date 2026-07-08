import { getContactsAction } from "@/modules/contact/presentation/actions";
import { TrackView } from "@/modules/event";
import { LeadForm } from "@/modules/inquiry/presentation/components/LeadForm";
import { ReviewList } from "@/modules/review";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
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
  TypographyH2,
  TypographyLarge,
  TypographySmall,
} from "@/shared/components/ui/typography";
import { cn, formatCurrency } from "@/shared/lib/utils";
import { cacheLife, cacheTag } from "next/cache";
import { localizeRichText } from "@/shared/lib/seo-utils";

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

function getFallbackServiceFaq(
  service: ServiceWithRelations,
  location?: District,
): Array<{ question: string; answer: string }> {
  const title = service.title;
  const locName = location?.name || "TPHCM";

  if (location) {
    return [
      {
        question: `Dịch vụ ${title} có được thực hiện tại ${locName} không?`,
        answer: `Có, Điện máy ELC triển khai dịch vụ ${title} trực tiếp tại ${locName} bởi đội ngũ kỹ thuật viên giàu kinh nghiệm, được đào tạo bài bản đảm bảo chất lượng tốt nhất.`,
      },
      {
        question: `Chi phí ${title} tại ${locName} là bao nhiêu?`,
        answer: `Chi phí cụ thể phụ thuộc vào yêu cầu thực tế. Quý khách tại ${locName} có thể liên hệ hotline để nhận báo giá chính xác, minh bạch trước khi thực hiện.`,
      },
      {
        question: `Sau khi sử dụng dịch vụ ${title} tại ${locName}, có được hỗ trợ bảo hành không?`,
        answer: `Điện máy ELC cam kết hỗ trợ bảo hành sau dịch vụ tại ${locName}. Nếu phát sinh sự cố sau thi công, đội ngũ kỹ thuật sẽ xử lý nhanh chóng và trách nhiệm.`,
      },
    ];
  }

  return [
    {
      question: `Dịch vụ ${title} của Điện máy ELC bao gồm những gì?`,
      answer: `Dịch vụ ${title} của Điện máy ELC bao gồm tư vấn kỹ thuật, thi công lắp đặt chuyên nghiệp và hỗ trợ bảo hành sau dịch vụ đầy đủ.`,
    },
    {
      question: `Điện máy ELC có bảo hành sau khi hoàn thiện dịch vụ ${title} không?`,
      answer: `Có, Điện máy ELC cam kết bảo hành chất lượng thi công. Nếu phát sinh sự cố do lỗi kỹ thuật sau khi hoàn thành, đội ngũ sẽ xử lý miễn phí theo chính sách bảo hành.`,
    },
    {
      question: `Thời gian thực hiện dịch vụ ${title} mất bao lâu?`,
      answer: `Thời gian thực hiện phụ thuộc vào quy mô công trình. Đội ngũ kỹ thuật ELC sẽ khảo sát trước và thông báo tiến độ cụ thể trước khi thực hiện.`,
    },
  ];
}

async function getCachedServiceDetailModuleData(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag("services-list", `service-slug:${slug}`);

  const { data: rawContacts } = await getContactsAction();
  const contacts = (rawContacts || []).filter((c) => c.isActive);

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
                            <ImageWithSkeleton
                              src={img.url}
                              alt={img.alt || (location ? `${service.title} tại ${location.name} - Điện máy ELC` : `${service.title} - Điện máy ELC`)}
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
                  <ProductDescription content={localizeRichText(service.content, location)} />
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

      {/* ===== SECTION 4.5: FAQ ===== */}
      {(() => {
        const faqList = getFallbackServiceFaq(service, location);
        if (faqList.length === 0) return null;
        const faqSchema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqList.map((item) => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": { "@type": "Answer", "text": item.answer },
          })),
        };
        return (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <GridSection
              id="service-detail-faq"
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
          </>
        );
      })()}

      {/* ===== SECTION 4.5: DANH GIA KHACH HANG ===== */}
      <GridSection
        id="service-detail-reviews"
        isFirst={false}
        showDiamond={true}
        contentClassName="py-10 border-t border-border/30"
      >
        <div className="w-full max-w-4xl mx-auto">
          <ReviewList serviceId={service.id} entityName={service.title} />
        </div>
      </GridSection>

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
