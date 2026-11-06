import Link from "next/link";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { SERVICE_LINE_ORDER } from "../../../domain/line";
import { getServicesAction } from "../../actions";
import { ServiceZaloButton } from "../ServiceZaloButton";

const MAX_SERVICES = 3;

interface ProductServicesSectionProps {
  productName: string;
  productSlug: string;
  categoryId: string;
}

// "Lắp đặt và dịch vụ đi kèm" on a product page: the services linked to this
// product's category (admin: edit a service, "Áp dụng cho sản phẩm"). A product
// is only half of the sale here, installation is quoted over Zalo, so this puts
// the next step next to the product and carries the product into the message.
export async function ProductServicesSection({ productName, productSlug, categoryId }: ProductServicesSectionProps) {
  const { data: published } = await getServicesAction({ isPublished: true });
  const related = published
    .filter((service) => service.categoryIds.includes(categoryId))
    .sort(
      (a, b) =>
        SERVICE_LINE_ORDER.indexOf(a.line) - SERVICE_LINE_ORDER.indexOf(b.line) || a.orderIndex - b.orderIndex,
    )
    .slice(0, MAX_SERVICES);

  if (related.length === 0) return null;

  return (
    <section
      aria-labelledby="product-services-heading"
      className={cn("w-full max-w-350 mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 border-t border-dashed border-border/40")}
    >
      <div className="mb-8 flex max-w-2xl flex-col gap-2">
        <h2 id="product-services-heading" className="type-title">
          Lắp đặt và dịch vụ đi kèm
        </h2>
        <p className="type-body text-muted-foreground">
          Nhắn Zalo để được khảo sát và báo giá đúng với nơi bạn lắp. Tin nhắn có sẵn tên sản phẩm này.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {related.map((service) => (
          <li
            key={service.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5"
          >
            <h3 className="type-body-strong">
              <Link href={`/dich-vu/${service.slug}`} className="transition-colors hover:text-primary">
                {service.title}
              </Link>
            </h3>
            {service.description && (
              <p className="type-body-sm text-muted-foreground line-clamp-3">{service.description}</p>
            )}
            {service.labels && service.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {service.labels.map((label) => (
                  <Badge key={label} variant="secondary">
                    {label}
                  </Badge>
                ))}
              </div>
            )}
            <ServiceZaloButton
              id={service.id}
              title={service.title}
              slug={service.slug}
              line={service.line}
              briefPrompts={service.briefPrompts}
              product={{ name: productName, slug: productSlug }}
              placement="product-block"
              variant="outline"
              className="mt-auto w-full"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
