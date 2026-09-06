"use client";

import type { CategoryWithGroup } from "@/modules/category/domain/types";

import { EntityPickerCard } from "./EntityPickerCard";
import { PickerLayout } from "./PickerLayout";

export interface PickedServiceCategory {
  id: string;
  name: string;
  slug: string;
  // The category's parent group (Máy lạnh / Máy lọc không khí / Máy lọc
  // nước / Nhà thông minh) — LeadFormScreen's "install" supportType
  // branches its capacity question on this, same reasoning as
  // ProductCategoryPickerStep's own groupSlug.
  groupSlug?: string;
}

interface ServiceCategoryPickerStepProps {
  categories: CategoryWithGroup[] | null;
  selectedId?: string;
  onSelect: (category: PickedServiceCategory) => void;
  onSkip: () => void;
}

// Lists the product-category catalog (shared with ProductCategoryPickerStep)
// rather than the `Service` entity itself — a service group like "Lắp đặt"
// only has a handful of catalog `Service` rows (often just 1-2 stub
// entries), so picking from those was frequently near-empty. Categories are
// the well-populated catalog (8-12+ rows), so asking "dòng máy nào" instead
// of "dịch vụ cụ thể nào" is never sparse regardless of how few Service
// rows admin has actually created.
export function ServiceCategoryPickerStep({
  categories,
  selectedId,
  onSelect,
  onSkip,
}: ServiceCategoryPickerStepProps) {
  return (
    <PickerLayout
      question="Dịch vụ áp dụng cho dòng máy nào?"
      loading={categories === null}
      skipLabel="Chưa rõ dòng máy cụ thể"
      onSkip={onSkip}
    >
      <div className="grid grid-cols-2 gap-3">
        {(categories ?? []).map((category) => (
          <EntityPickerCard
            key={category.id}
            title={category.name}
            selected={selectedId === category.id}
            onClick={() =>
              onSelect({ id: category.id, name: category.name, slug: category.slug, groupSlug: category.group?.slug })
            }
          />
        ))}
      </div>
    </PickerLayout>
  );
}
