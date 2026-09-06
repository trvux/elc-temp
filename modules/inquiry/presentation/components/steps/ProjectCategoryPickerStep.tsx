"use client";

import type { CategoryWithGroup } from "@/modules/category/domain/types";

import { EntityPickerCard } from "./EntityPickerCard";
import { PickerLayout } from "./PickerLayout";

export interface PickedProjectCategory {
  id: string;
  name: string;
  slug: string;
}

interface ProjectCategoryPickerStepProps {
  categories: CategoryWithGroup[] | null;
  selectedIds: string[];
  onToggle: (category: PickedProjectCategory) => void;
  onSkip: () => void;
}

// Multi-select, unlike every other EntityPickerCard step in this flow — a
// project commonly needs several equipment lines at once (e.g. wall-mounted
// AC + fresh-air filtration), so tapping a card toggles it in/out of the
// selection instead of immediately advancing. The visitor confirms with the
// OK button once they've picked everything relevant (see showOkButton in
// LeadFormScreen).
export function ProjectCategoryPickerStep({
  categories,
  selectedIds,
  onToggle,
  onSkip,
}: ProjectCategoryPickerStepProps) {
  return (
    <PickerLayout
      question="Công trình cần lắp những dòng máy nào?"
      description="Có thể chọn nhiều dòng máy."
      loading={categories === null}
      skipLabel="Chưa rõ, để tư vấn viên khảo sát"
      onSkip={onSkip}
    >
      <div className="grid grid-cols-2 gap-3">
        {(categories ?? []).map((category) => (
          <EntityPickerCard
            key={category.id}
            title={category.name}
            selected={selectedIds.includes(category.id)}
            onClick={() => onToggle({ id: category.id, name: category.name, slug: category.slug })}
          />
        ))}
      </div>
    </PickerLayout>
  );
}
