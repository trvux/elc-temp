"use client";

import { cn } from "@/shared/lib/utils";

import type { ServiceLine } from "@/modules/service/domain/line";

export type LeadBranch = "product" | "service" | "project";

// What the visitor picked in the menu. Services split by intent into two doors
// ("I need a system built" vs "my unit needs work"), so a service choice also
// carries which line it opens.
export interface BranchChoice {
  branch: LeadBranch;
  line?: ServiceLine;
}

interface BranchOption {
  key: string;
  choice: BranchChoice;
  label: string;
  description: string;
}

// The "project" branch (case-study based, longer) is no longer offered here: a
// building that needs a system is a "thi-cong" service. It is still used when
// the form is opened from a project page.
const BRANCH_OPTIONS: BranchOption[] = [
  {
    key: "product",
    choice: { branch: "product" },
    label: "Mua sản phẩm",
    description: "Máy lạnh, máy lọc không khí, hệ thống khí tươi...",
  },
  {
    key: "thi-cong",
    choice: { branch: "service", line: "thi-cong" },
    label: "Thi công hệ thống cho công trình",
    description: "Điều hòa trung tâm VRV, cấp gió tươi thu hồi nhiệt, lắp đặt máy lạnh...",
  },
  {
    key: "dich-vu",
    choice: { branch: "service", line: "dich-vu" },
    label: "Dịch vụ máy lạnh",
    description: "Vệ sinh bảo trì, sửa chữa, thu cũ đổi mới, cho thuê...",
  },
];

interface BranchSelectStepProps {
  onSelect: (choice: BranchChoice) => void;
}

export function BranchSelectStep({ onSelect }: BranchSelectStepProps) {
  return (
    <div>
      <h1 id="step-question" className="type-headline text-white drop-shadow-sm">
        Bạn đang cần gì hôm nay?
      </h1>
      <p id="step-description" className="type-body mt-3 text-white/80 drop-shadow-sm">Chọn một mục để bắt đầu.</p>

      <div role="group" aria-labelledby="step-question" aria-describedby="step-description" className="mt-8 flex flex-col gap-3">
        {BRANCH_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onSelect(option.choice)}
            className={cn(
              "w-full rounded-lg border-2 px-5 py-4 text-left transition-colors",
              "border-white/40 hover:border-white",
            )}
          >
            <span className="block type-body-strong text-white drop-shadow-sm">{option.label}</span>
            <span className="mt-0.5 block type-body-sm text-white/70 drop-shadow-sm">{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
