"use client";

import type { ServiceGroup } from "@/modules/service-group/domain/types";

import { EntityPickerCard } from "./EntityPickerCard";
import { PickerLayout } from "./PickerLayout";
import { getServiceGroupModelKey } from "./three-models.js";

export interface PickedServiceGroup {
  id: string;
  name: string;
  slug: string;
}

interface ServiceGroupPickerStepProps {
  groups: ServiceGroup[] | null;
  selectedId?: string;
  onSelect: (group: PickedServiceGroup) => void;
  onSkip: () => void;
}

export function ServiceGroupPickerStep({ groups, selectedId, onSelect, onSkip }: ServiceGroupPickerStepProps) {
  return (
    <PickerLayout
      question="Bạn cần nhóm dịch vụ nào?"
      loading={groups === null}
      skipLabel="Chưa rõ, cần tư vấn chọn dịch vụ"
      onSkip={onSkip}
    >
      <div className="grid grid-cols-2 gap-3">
        {(groups ?? []).map((group) => (
          <EntityPickerCard
            key={group.id}
            modelKey={getServiceGroupModelKey(group.slug)}
            title={group.name}
            selected={selectedId === group.id}
            onClick={() => onSelect({ id: group.id, name: group.name, slug: group.slug })}
          />
        ))}
      </div>
    </PickerLayout>
  );
}
