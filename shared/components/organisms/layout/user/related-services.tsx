import { cn } from "@/shared/lib/utils";
import { CardService } from "@/modules/service/presentation/components/CardService";
import { mapServiceToCardData } from "@/modules/service/domain/mappers";
import { getServicesAction } from "@/modules/service/presentation/actions";
import type { ServiceLine } from "@/modules/service/domain/line";

interface RelatedServicesProps {
  line: ServiceLine;
  currentServiceId: string;
}

const STYLES = {
  section: cn("w-full"),
  title: cn("mb-10"),
  grid: cn("grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"),
};

export default async function RelatedServices({
  line,
  currentServiceId,
}: RelatedServicesProps) {
  // Related = the other services of the same line (same kind of need).
  const { data: published } = await getServicesAction({ isPublished: true });

  const services = published
    .filter((s) => s.line === line && s.id !== currentServiceId)
    .slice(0, 3);

  if (services.length === 0) return null;

  return (
    <section className={STYLES.section}>
      <h2 className={cn("type-title", STYLES.title)}>Dịch vụ liên quan</h2>
      <ul className={STYLES.grid}>
        {services.map((service) => {
          const cardProps = mapServiceToCardData(service);
          return (
            <li key={service.id} className="flex flex-col">
              <CardService {...cardProps} headingAs="h3" />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
