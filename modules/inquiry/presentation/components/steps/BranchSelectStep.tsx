"use client";

import { ArrowRight } from "@phosphor-icons/react";

import { Button } from "@/shared/components/ui/button";

import { DragRotate3DCard } from "./DragRotate3DCard";

export type LeadBranch = "product" | "service" | "project";

interface BranchOption {
  value: LeadBranch;
  label: string;
  description: string;
  modelKey: "ac-unit" | "toolbox" | "building";
}

const BRANCH_OPTIONS: BranchOption[] = [
  {
    value: "product",
    label: "Mua sản phẩm",
    description: "Máy lạnh, máy lọc không khí, hệ thống khí tươi...",
    modelKey: "ac-unit",
  },
  {
    value: "service",
    label: "Dịch vụ",
    description: "Lắp đặt, bảo trì - vệ sinh, sửa chữa, thu cũ đổi mới...",
    modelKey: "toolbox",
  },
  {
    value: "project",
    label: "Dự án công trình",
    description: "Nhà ở, nhà hàng - khách sạn, văn phòng, nhà xưởng...",
    modelKey: "building",
  },
];

interface BranchSelectStepProps {
  onSelect: (branch: LeadBranch) => void;
}

export function BranchSelectStep({ onSelect }: BranchSelectStepProps) {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-balance">
        Bạn đang cần gì hôm nay?
      </h1>
      <p className="mt-3 text-muted-foreground">Chọn một mục để bắt đầu.</p>

      {/* Structure (explicit user spec):
            wrapper — translucent bg-muted/10 frame, border, padding
            -> card con (aspect-[4/3] landscape — this level carries the
               ratio, not the wrapper)
                 -> 3D model (top, flex-1 — fills whatever's left)
                 -> title + description (bottom, fixed compact row)
            -> button (below card con, inside the wrapper's padded frame)
          Fixed 2 columns at every breakpoint, no responsive collapse to 1
          column (explicit user instruction — an earlier pass had 1 column
          on mobile/portrait-tablet and 2 from `lg` up; the user then asked
          for 2 columns synced across all of them, including mobile). See
          docs/interactive-3d-icon-pattern.md's "Cards are 4:3" section for
          the full back-and-forth on this structure, including an
          overlay/poster attempt that got the ratio right but wasn't the
          stacked layout wanted. */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        {BRANCH_OPTIONS.map((option) => (
          <div
            key={option.value}
            className="group flex flex-col gap-2 rounded-xl border border-border bg-muted/10 p-2 backdrop-blur-sm transition-colors duration-200 ease-out hover:border-blue-300/60"
          >
            <div className="relative flex aspect-[4/3] flex-col overflow-hidden rounded-lg bg-background shadow-sm transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <div className="relative min-h-0 flex-1 bg-muted/40">
                <DragRotate3DCard modelKey={option.modelKey} className="absolute inset-0" />
              </div>
              <div className="shrink-0 px-3 py-2">
                <p className="font-semibold">{option.label}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{option.description}</p>
              </div>
            </div>

            <Button type="button" onClick={() => onSelect(option.value)} className="w-full">
              Chọn mục này
              <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
