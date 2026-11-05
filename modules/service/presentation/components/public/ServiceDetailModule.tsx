import { getContactsAction } from "@/modules/contact/presentation/actions";
import { TrackView } from "@/modules/event";
import { LeadForm } from "@/modules/inquiry/presentation/components/LeadForm";
import { ServiceWithRelations } from "@/modules/service/domain/types";
import { Breadcrumbs } from "@/shared/components/organisms/layout/user/breadcrumbs";
import { OrderButton } from "@/shared/components/organisms/layout/user/order-button";
import { PreviewContent } from "@/shared/components/organisms/layout/user/preview-content";
import RelatedServices from "@/shared/components/organisms/layout/user/related-services";
import Image from "next/image";
import { cn } from "@/shared/lib/utils";
import { formatCurrency } from "@/shared/lib/format";
import { BASE_URL, SEOSchema, toJsonLdHtml } from "@/shared/lib/seo-schema";
import { FAQAccordion, getFAQsAction } from "@/modules/faq";

interface ServiceDetailModuleProps {
  service: ServiceWithRelations;
}

// Three widths, nothing else: `wide` for the image and the closing block,
// `hero` for the centred title block, `prose` for everything that is read
// (body text, FAQ, pager). A single reading column keeps the left edge of
// the text identical from the first paragraph to the last.
const GUTTER = "mx-auto w-full px-4 md:px-6";
const STYLES = {
  main: cn("w-full bg-background flex flex-col"),
  wide: cn(GUTTER, "max-w-5xl"),
  hero: cn(GUTTER, "max-w-3xl"),
  prose: cn(GUTTER, "max-w-2xl"),
  // One vertical rhythm between sections (3rem on mobile, 4rem from md).
  section: cn("pb-12 md:pb-16"),
};

export async function ServiceDetailModule({
  service,
}: ServiceDetailModuleProps) {
  const { data: rawContacts } = await getContactsAction();
  const contacts = (rawContacts || []).filter((c) => c.isActive);
  const { data: faqs } = await getFAQsAction("service", service.id);

  const image = service.images?.[0];
  // Every hero image carries an alt and a visible caption: alt for screen
  // readers and image search, caption for the reader and for answer engines.
  const imageAlt = image?.alt?.trim() || `${service.title} - Điện máy ELC`;
  const imageCaption = image?.caption?.trim();
  const pageUrl = `${BASE_URL}/dich-vu/${service.slug}`;
  const imageUrl = image
    ? image.url.startsWith("/")
      ? `${BASE_URL}${image.url}`
      : image.url
    : undefined;
  const updatedAt = new Date(service.updatedAt);
  const hasUpdatedAt = !Number.isNaN(updatedAt.getTime());
  const finalPrice = service.salePrice || service.originalPrice;

  // The strip under the image is driven entirely by data: the service's own
  // labels ("Bảo hành 24 tháng chính hãng", "Khảo sát báo giá miễn phí", ...),
  // plus a starting price only when a real number is set and there is no
  // free-text price. No claim is hard-coded here, because this component
  // renders every service.
  const facts: string[] = [...(service.labels ?? [])];
  if (!service.priceDisplayText && finalPrice) {
    facts.unshift(`Từ ${formatCurrency(finalPrice)}`);
  }

  // The group name is only useful above the title when it adds something: a
  // single-service group ("Cho thuê" over "Cho thuê máy lạnh") would just
  // repeat the title, so those fall back to the generic "Dịch vụ".
  const groupName = service.group?.name;
  const eyebrow =
    groupName && !service.title.toLowerCase().includes(groupName.toLowerCase())
      ? groupName
      : "Dịch vụ";

  const serviceSchema = SEOSchema.getService({
    title: service.title,
    slug: service.slug,
    metaDescription: service.metaDescription,
    description: service.description,
    image: imageUrl ? { url: imageUrl, alt: imageAlt, caption: imageCaption } : null,
  });
  const webPageSchema = SEOSchema.getWebPage({
    name: service.metaTitle || service.title,
    url: pageUrl,
    description: service.metaDescription || service.description,
    datePublished: service.createdAt,
    dateModified: service.updatedAt,
    imageUrl,
    aboutId: `${pageUrl}#service`,
  });
  const faqSchema = faqs.length > 0 ? SEOSchema.getFAQPage(faqs) : null;

  return (
    <main className={STYLES.main}>
      <TrackView entityType="service" entityId={service.id} entityName={service.title} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdHtml({ "@context": "https://schema.org", ...webPageSchema }) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdHtml({ "@context": "https://schema.org", ...serviceSchema }) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLdHtml({ "@context": "https://schema.org", ...faqSchema }) }}
        />
      )}

      <div className={cn(STYLES.wide, "pt-2")}>
        <Breadcrumbs
          items={[
            { label: "Dịch vụ", href: "/dich-vu" },
            { label: service.title, active: true },
          ]}
        />
      </div>

      {/* One focus: label, title, one sentence, one primary action. */}
      <header
        className={cn(
          STYLES.hero,
          "flex flex-col items-center gap-4 pt-8 pb-10 text-center md:gap-6 md:pt-12 md:pb-14",
        )}
      >
        <p className="type-label text-muted-foreground">{eyebrow}</p>
        <h1 className="type-display">{service.title}</h1>
        {service.description && (
          <p className="type-body max-w-xl text-balance text-muted-foreground">
            {service.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <LeadForm
            serviceId={service.id}
            entityName={service.title}
            entityKind="service"
            triggerLabel="Yêu cầu tư vấn"
            triggerVariant="default"
            showIcon={false}
          />
          <OrderButton
            contacts={contacts}
            leadType="service"
            entityId={service.id}
            label="Nhắn Zalo"
            variant="ghost"
          />
        </div>
      </header>

      {image && (
        <figure className={STYLES.wide}>
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
            <Image
              src={image.url}
              alt={imageAlt}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 1024px, 100vw"
            />
          </div>
          {imageCaption && (
            <figcaption className="type-caption mt-3 text-center text-muted-foreground">
              {imageCaption}
            </figcaption>
          )}
        </figure>
      )}

      {facts.length > 0 && (
        <div className={cn(STYLES.wide, "mt-10 md:mt-12")}>
          <ul className="flex flex-col divide-y divide-border border-y border-border sm:flex-row sm:divide-x sm:divide-y-0">
            {facts.map((fact) => (
              <li key={fact} className="type-body-sm flex-1 px-4 py-5 text-center">
                {fact}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* The article is shown in full: this page is the reading material, so
          it is not collapsed behind a "show more" button the way product
          descriptions are. */}
      {service.content && (
        <section className={cn(STYLES.prose, "py-12 md:py-16")}>
          <PreviewContent
            content={service.content}
            size="lg"
            fallbackAlt={service.title}
          />
          {hasUpdatedAt && (
            <p className="type-caption mt-10 text-muted-foreground">
              Cập nhật lần cuối:{" "}
              <time dateTime={updatedAt.toISOString()}>
                {new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(updatedAt)}
              </time>
            </p>
          )}
        </section>
      )}

      {faqs.length > 0 && (
        <div className={cn(STYLES.prose, STYLES.section)}>
          <FAQAccordion faqs={faqs} />
        </div>
      )}

      <section className={cn(STYLES.wide, STYLES.section)}>
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-muted px-6 py-12 text-center md:py-16">
          <h2 className="type-headline">Cần tư vấn cho công trình của bạn?</h2>
          <p className="type-body max-w-md text-balance text-muted-foreground">
            Để lại thông tin, đội ngũ ELC sẽ liên hệ tư vấn và báo giá.
          </p>
          <LeadForm
            serviceId={service.id}
            entityName={service.title}
            entityKind="service"
            triggerLabel="Yêu cầu tư vấn"
            triggerVariant="default"
            showIcon={false}
          />
        </div>
      </section>

      {service.groupId && (
        <div className={cn(STYLES.wide, STYLES.section)}>
          <RelatedServices
            groupId={service.groupId}
            currentServiceId={service.id}
          />
        </div>
      )}
    </main>
  );
}
