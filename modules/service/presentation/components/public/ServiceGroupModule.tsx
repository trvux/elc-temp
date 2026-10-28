import { CardService } from "@/modules/service/presentation/components/CardService";
import { mapServiceToCardData } from "@/modules/service/domain/mappers";
import type { ServiceWithRelations } from "@/modules/service/domain/types";
import type { ServiceGroup } from "@/modules/service-group/domain/types";
import { Breadcrumbs } from "@/shared/components/organisms/layout/user/breadcrumbs";
import { PageHero } from "@/shared/components/organisms/sections/page-hero";
import { BASE_URL, toJsonLdHtml } from "@/shared/lib/seo-schema";
import { primaryImageUrl } from "@/shared/lib/image-asset";

interface ServiceGroupModuleProps {
  group: ServiceGroup;
  services: ServiceWithRelations[];
}

const container =
  "mx-auto h-full w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-12 relative py-6 md:py-8 lg:py-10";

// Landing page for a service group with several services — same layout as
// the /dich-vu hub, filtered to one group.
export function ServiceGroupModule({ group, services }: ServiceGroupModuleProps) {
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: group.name,
    url: `${BASE_URL}/dich-vu/${group.slug}`,
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
    <main className="w-full bg-background flex flex-col flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdHtml(itemListSchema) }}
      />
      <div className="w-full relative">
        <div className={container}>
          <PageHero title={group.name} description={group.metaDescription ?? undefined} />
        </div>
      </div>
      <div className="w-full relative">
        <div className={container}>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {services.map((service) => (
              <li key={service.id} className="flex flex-col">
                <CardService {...mapServiceToCardData(service)} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="w-full relative">
        <div className="mx-auto w-full max-w-350 min-[112.5rem]:max-w-384 px-4 md:px-6 lg:px-12 py-1">
          <Breadcrumbs
            items={[{ label: "Dịch vụ", href: "/dich-vu" }, { label: group.name, active: true }]}
          />
        </div>
      </div>
    </main>
  );
}
