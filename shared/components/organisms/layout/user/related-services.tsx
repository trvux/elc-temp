import { TypographyH2 } from "@/shared/components/ui/typography";
import { cn } from "@/shared/lib/utils";
import { CardService } from "@/modules/service/presentation/components/CardService";
import { mapServiceToCardData } from "@/modules/service/domain/mappers";
import { getServicesAction } from "@/modules/service/presentation/actions";

interface RelatedServicesProps {
  groupId: string;
  currentServiceId: string;
}

const STYLES = {
  section: cn("w-full"),
  title: cn("mb-10"),
  grid: cn("grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"),
};

export default async function RelatedServices({
  groupId,
  currentServiceId,
}: RelatedServicesProps) {
  // Fetch related services in the same group
  const { data: groupServices } = await getServicesAction({ groupId, isPublished: true });

  const services = groupServices
    .filter((s) => s.id !== currentServiceId)
    .slice(0, 3);

  if (services.length === 0) return null;

  return (
    <section className={STYLES.section}>
      <TypographyH2 className={STYLES.title}>Dịch vụ liên quan</TypographyH2>
      <div className={STYLES.grid}>
        {services.map((service) => {
          const cardProps = mapServiceToCardData(service);
          return <CardService key={service.id} {...cardProps} />;
        })}
      </div>
    </section>
  );
}
