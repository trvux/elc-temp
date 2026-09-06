"use client";

import type { ProjectTypeWithCategories } from "@/modules/project-type/domain/types";

import { EntityPickerCard } from "./EntityPickerCard";
import { PickerLayout } from "./PickerLayout";

export interface PickedProjectType {
  id: string;
  name: string;
  slug: string;
}

interface ProjectTypePickerStepProps {
  projectTypes: ProjectTypeWithCategories[] | null;
  selectedId?: string;
  onSelect: (projectType: PickedProjectType) => void;
  onSkip: () => void;
}

export function ProjectTypePickerStep({
  projectTypes,
  selectedId,
  onSelect,
  onSkip,
}: ProjectTypePickerStepProps) {
  return (
    <PickerLayout
      question="Loại công trình của bạn?"
      loading={projectTypes === null}
      skipLabel="Chưa rõ, cứ để tư vấn viên gợi ý"
      onSkip={onSkip}
    >
      <div className="grid grid-cols-2 gap-3">
        {(projectTypes ?? []).map((type) => (
          <EntityPickerCard
            key={type.id}
            title={type.name}
            selected={selectedId === type.id}
            onClick={() => onSelect({ id: type.id, name: type.name, slug: type.slug })}
          />
        ))}
      </div>
    </PickerLayout>
  );
}
