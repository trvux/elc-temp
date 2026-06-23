import { TypographyH2 } from "@/shared/components/ui/typography";
import { createClient } from "@/shared/lib/supabase/server";
import { cn } from "@/shared/lib/utils";
import { CardService } from "@/modules/service/presentation/components/CardService";
import { mapServiceToCardData } from "@/modules/service/domain/mappers";
import { ServiceWithRelations } from "@/modules/service/domain/types";

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
  const supabase = await createClient();

  // Fetch related services in the same group
  const { data: rawServices } = await supabase
    .from("services")
    .select(`
      *,
      group:service_groups(*),
      category:categories(
        *,
        group:group_categories(*)
      )
    `)
    .eq("group_id", groupId)
    .neq("id", currentServiceId)
    .is("deleted_at", null)
    .eq("is_published", true)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(3);

  if (!rawServices || rawServices.length === 0) return null;

  // Map to ServiceWithRelations entities
  const services: ServiceWithRelations[] = rawServices.map((row) => {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      groupId: row.group_id,
      categoryId: row.category_id,
      originalPrice: row.original_price,
      salePrice: row.sale_price,
      discountPercent: row.discount_percent,
      priceDisplayText: row.price_display_text,
      labels: row.labels,
      description: row.description,
      content: row.content,
      image: row.image,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      isFeatured: row.is_featured || false,
      isPublished: row.is_published ?? true,
      orderIndex: row.order_index || 0,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      deletedAt: row.deleted_at,
      group: row.group ? {
        id: row.group.id,
        name: row.group.name,
        slug: row.group.slug,
        imageUrl: row.group.image_url,
        metaTitle: row.group.meta_title,
        metaDescription: row.group.meta_description,
        isFeatured: row.group.is_featured || false,
        orderIndex: row.group.order_index || 0,
        createdAt: row.group.created_at || new Date().toISOString(),
        updatedAt: row.group.updated_at || new Date().toISOString(),
        deletedAt: row.group.deleted_at,
      } : null,
      category: null,
    };
  });

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
