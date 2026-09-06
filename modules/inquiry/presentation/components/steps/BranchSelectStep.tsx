"use client";

import { cn } from "@/shared/lib/utils";

export type LeadBranch = "product" | "service" | "project";

interface BranchOption {
  value: LeadBranch;
  label: string;
  description: string;
}

const BRANCH_OPTIONS: BranchOption[] = [
  {
    value: "product",
    label: "Mua sản phẩm",
    description: "Máy lạnh, máy lọc không khí, hệ thống khí tươi...",
  },
  {
    value: "service",
    label: "Dịch vụ",
    description: "Lắp đặt, bảo trì - vệ sinh, sửa chữa, thu cũ đổi mới...",
  },
  {
    value: "project",
    label: "Dự án công trình",
    description: "Nhà ở, nhà hàng - khách sạn, văn phòng, nhà xưởng...",
  },
];

interface BranchSelectStepProps {
  onSelect: (branch: LeadBranch) => void;
}

export function BranchSelectStep({ onSelect }: BranchSelectStepProps) {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-balance text-white drop-shadow-sm">
        Bạn đang cần gì hôm nay?
      </h1>
      <p className="mt-3 text-white/80 drop-shadow-sm">Chọn một mục để bắt đầu.</p>

      <div className="mt-8 flex flex-col gap-3">
        {BRANCH_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={cn(
              "w-full rounded-lg border-2 px-5 py-4 text-left transition-colors",
              "border-white/40 hover:border-white",
            )}
          >
            <p className="font-semibold text-white drop-shadow-sm">{option.label}</p>
            <p className="mt-0.5 text-sm text-white/70 drop-shadow-sm">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
