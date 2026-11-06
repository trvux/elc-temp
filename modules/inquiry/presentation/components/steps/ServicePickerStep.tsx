"use client";

import { SERVICE_LINES, groupServicesByLine } from "@/modules/service/domain/line";
import type { ServiceWithRelations } from "@/modules/service/domain/types";

import { EntityPickerCard } from "./EntityPickerCard";
import { PickerLayout } from "./PickerLayout";

interface ServicePickerStepProps {
  services: ServiceWithRelations[] | null;
  selectedId?: string;
  onSelect: (service: ServiceWithRelations) => void;
  onSkip: () => void;
}

// One question, the real services grouped under the two offerings: this is the
// same list the hub shows, so the visitor picks exactly what they were reading
// about. Replaces the old "service group, then product category" two-step.
export function ServicePickerStep({ services, selectedId, onSelect, onSkip }: ServicePickerStepProps) {
  const sections = groupServicesByLine(services ?? []);
  return (
    <PickerLayout
      question="Bạn quan tâm dịch vụ nào?"
      loading={services === null}
      skipLabel="Chưa rõ, cần tư vấn chọn dịch vụ"
      onSkip={onSkip}
    >
      <div className="flex flex-col gap-6">
        {sections.map(({ line, services: inLine }) => (
          <div key={line} role="group" aria-label={SERVICE_LINES[line].label}>
            <p className="type-label mb-3 text-white/80 drop-shadow-sm">{SERVICE_LINES[line].label}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {inLine.map((service) => (
                <EntityPickerCard
                  key={service.id}
                  title={service.title}
                  selected={selectedId === service.id}
                  onClick={() => onSelect(service)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </PickerLayout>
  );
}
