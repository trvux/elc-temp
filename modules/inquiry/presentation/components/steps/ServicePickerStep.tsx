"use client";

import { SERVICE_LINES, groupServicesByLine, type ServiceLine } from "@/modules/service/domain/line";
import type { ServiceWithRelations } from "@/modules/service/domain/types";

import { EntityPickerCard } from "./EntityPickerCard";
import { PickerLayout } from "./PickerLayout";

interface ServicePickerStepProps {
  services: ServiceWithRelations[] | null;
  // When the menu already chose a door, only that line's services are listed.
  line?: ServiceLine | null;
  selectedId?: string;
  onSelect: (service: ServiceWithRelations) => void;
  onSkip: () => void;
}

// One question, the real services grouped under the two offerings: this is the
// same list the hub shows, so the visitor picks exactly what they were reading
// about. Replaces the old "service group, then product category" two-step.
export function ServicePickerStep({ services, line: lineFilter, selectedId, onSelect, onSkip }: ServicePickerStepProps) {
  const sections = groupServicesByLine((services ?? []).filter((svc) => !lineFilter || svc.line === lineFilter));
  return (
    <PickerLayout
      question={lineFilter === "thi-cong" ? "Bạn cần thi công hạng mục nào?" : lineFilter === "dich-vu" ? "Bạn cần dịch vụ nào?" : "Bạn quan tâm dịch vụ nào?"}
      loading={services === null}
      skipLabel="Chưa rõ, cần tư vấn chọn dịch vụ"
      onSkip={onSkip}
    >
      <div className="flex flex-col gap-6">
        {sections.map(({ line: sectionLine, services: inLine }) => (
          <div key={sectionLine} role="group" aria-label={SERVICE_LINES[sectionLine].label}>
            {!lineFilter && <p className="type-label mb-3 text-white/80 drop-shadow-sm">{SERVICE_LINES[sectionLine].label}</p>}
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
