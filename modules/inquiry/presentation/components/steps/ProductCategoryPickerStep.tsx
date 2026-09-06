"use client";

import type { CategoryWithGroup } from "@/modules/category/domain/types";

import { EntityPickerCard } from "./EntityPickerCard";
import { PickerLayout } from "./PickerLayout";
import { getCategoryModelKey } from "./three-models.js";

export interface PickedProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductCategoryPickerStepProps {
  categories: CategoryWithGroup[] | null;
  selectedId?: string;
  onSelect: (category: PickedProductCategory) => void;
  onSkip: () => void;
}

// Picks a category (Máy lạnh treo tường, Máy lạnh âm trần...), not a
// specific product — a lead form isn't a product search page. Picking an
// exact SKU here would make the follow-up "quy mô/công suất" and "ngân
// sách" questions redundant (a specific product already has both), and
// picking exactly which unit to buy is what the sales follow-up is for.
export function ProductCategoryPickerStep({
  categories,
  selectedId,
  onSelect,
  onSkip,
}: ProductCategoryPickerStepProps) {
  return (
    <PickerLayout
      question="Bạn quan tâm dòng sản phẩm nào?"
      loading={categories === null}
      skipLabel="Bỏ qua, chỉ cần tư vấn chung"
      onSkip={onSkip}
    >
      <div className="grid grid-cols-2 gap-3">
        {(categories ?? []).map((category) => (
          <EntityPickerCard
            key={category.id}
            modelKey={getCategoryModelKey(category.slug)}
            title={category.name}
            selected={selectedId === category.id}
            onClick={() => onSelect({ id: category.id, name: category.name, slug: category.slug })}
          />
        ))}
      </div>
    </PickerLayout>
  );
}
