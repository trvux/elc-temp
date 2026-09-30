import Link from "next/link";

import type { ServiceWithRelations } from "@/modules/service/domain/types";
import { mapServiceToCardData } from "@/modules/service/domain/mappers";
import { CardService } from "@/modules/service/presentation/components/CardService";
import { Button } from "@/shared/components/ui/button";
import { TypographyH2 } from "@/shared/components/ui/typography";

interface ServicesTeaserSectionProps {
  services: ServiceWithRelations[];
}

// Homepage hub teaser into the /dich-vu vertical — same "title links to the
// hub, then a small real preview" shape the other 3 homepage teasers use
// (category banners, project marquee, news), so all 4 verticals read as one
// consistent flywheel pattern instead of sản phẩm being the only one with
// real estate here.
export function ServicesTeaserSection({ services }: ServicesTeaserSectionProps) {
  if (services.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8">
      <Button asChild variant="link">
        <Link
          href="/dich-vu"
          className="group relative inline-flex items-center justify-center transition-colors p-2"
        >
          <TypographyH2>Dịch vụ</TypographyH2>
        </Link>
      </Button>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {services.map((service) => {
          const cardProps = mapServiceToCardData(service);
          return <CardService key={service.id} {...cardProps} />;
        })}
      </div>

      <Button asChild variant="outline" size="lg">
        <Link href="/dich-vu">Xem tất cả dịch vụ</Link>
      </Button>
    </div>
  );
}
