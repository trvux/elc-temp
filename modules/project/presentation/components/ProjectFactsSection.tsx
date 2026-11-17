"use client";

import { useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";

import { Button } from "@/shared/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/lib/utils";

import { PROVINCES, currentProvinceFor, provinceLabel } from "../../domain/provinces";
import { projectCondition } from "../../domain/types";
import type { ProjectFormValues } from "../hooks/useProjectForm";

const SUGGESTED_BRANDS = [
  "Daikin",
  "Menred",
  "Hagisu",
  "Reetech",
  "LG",
  "Panasonic",
  "Mitsubishi Electric",
  "Toshiba",
  "Samsung",
  "Gree",
];

const PRECISION_OPTIONS = [
  { value: "day", label: "Biết ngày cụ thể" },
  { value: "month", label: "Chỉ biết tháng/năm" },
  { value: "year", label: "Chỉ biết năm" },
  { value: "unknown", label: "Chưa rõ" },
] as const;

const CONDITION_LABEL = {
  new: "Thiết bị mới",
  used: "Thiết bị qua sử dụng",
  mixed: "Hỗn hợp (mới và qua sử dụng)",
} as const;

// A numeric fact: empty input means "unknown" (null), never 0 — the Go side
// and the DB both reject non-positive numbers, and null is never rendered.
function NumberFact({
  form,
  name,
  label,
  hint,
  step,
}: {
  form: UseFormReturn<ProjectFormValues>;
  name:
    | "facts.indoorUnits"
    | "facts.capacityHp"
    | "facts.airflowM3h"
    | "facts.areaM2"
    | "facts.floors"
    | "facts.durationDays"
    | "facts.warrantyMonths";
  label: string;
  hint?: string;
  step?: string;
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel>{label}</FieldLabel>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step={step ?? "1"}
            value={field.value ?? ""}
            onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
          />
          {hint ? <FieldDescription>{hint}</FieldDescription> : null}
          {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}

function BrandsField({ form }: { form: UseFormReturn<ProjectFormValues> }) {
  const [custom, setCustom] = useState("");
  return (
    <Controller
      control={form.control}
      name="facts.brands"
      render={({ field }) => {
        const brands: string[] = field.value ?? [];
        const toggle = (b: string) =>
          field.onChange(brands.includes(b) ? brands.filter((x) => x !== b) : [...brands, b]);
        const extra = brands.filter((b) => !SUGGESTED_BRANDS.includes(b));
        return (
          <Field>
            <FieldLabel>Hãng thiết bị đã thi công</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {[...SUGGESTED_BRANDS, ...extra].map((b) => (
                <Button
                  key={b}
                  type="button"
                  size="sm"
                  variant={brands.includes(b) ? "default" : "outline"}
                  onClick={() => toggle(b)}
                >
                  {b}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Hãng khác..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = custom.trim();
                    if (v && !brands.includes(v)) field.onChange([...brands, v]);
                    setCustom("");
                  }
                }}
              />
            </div>
            <FieldDescription>
              Chỉ chọn hãng thực sự có trong công trình. Không ghi &quot;đối tác/đại lý chính hãng&quot; ở bất cứ đâu cho tới khi có giấy tờ.
            </FieldDescription>
          </Field>
        );
      }}
    />
  );
}

export function ProjectFactsSection({
  form,
  publishGaps,
}: {
  form: UseFormReturn<ProjectFormValues>;
  /** Staff-only list from the server: what is still missing to publish. */
  publishGaps?: string[];
}) {
  const location = form.watch("location");
  const province = form.watch("facts.province");
  const clientKind = form.watch("facts.clientKind");
  const consentAt = form.watch("facts.clientConsentAt");
  const completedAt = form.watch("completedAt");
  const condition = projectCondition(form.watch("categories"));
  // Old articles name pre-merger provinces ("Bà Rịa - Vũng Tàu"): suggest the
  // current one instead of silently guessing.
  const suggested = location ? currentProvinceFor(location) ?? currentProvinceFor(location.split(",").pop() ?? "") : null;

  return (
    <div className="space-y-6 border p-6 rounded-2xl bg-muted/10">
      <div className="border-b pb-2">
        <h3 className="type-label">Dữ liệu dự án (SEO &amp; GEO)</h3>
        <p className="type-legal text-muted-foreground">
          Số liệu thật của công trình. Để trống nếu chưa có hồ sơ: ô trống không hiển thị và không bao giờ được điền số ước chừng.
        </p>
      </div>

      {publishGaps && publishGaps.length > 0 ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="type-label">Còn thiếu để xuất bản mới (hoặc đạt chuẩn):</p>
          <ul className="list-disc pl-5 type-legal">
            {publishGaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          control={form.control}
          name="facts.province"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Tỉnh / thành phố (hiện hành)</FieldLabel>
              <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tỉnh/thành" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Chưa chọn</SelectItem>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {provinceLabel(p.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {suggested && suggested !== province ? (
                <FieldDescription>
                  Địa điểm cũ &quot;{location}&quot; thuộc{" "}
                  <button type="button" className="underline" onClick={() => field.onChange(suggested)}>
                    {provinceLabel(suggested)}
                  </button>{" "}
                  (từ 1/7/2025). Bấm để chọn.
                </FieldDescription>
              ) : (
                <FieldDescription>34 đơn vị cấp tỉnh từ 1/7/2025, không còn cấp huyện.</FieldDescription>
              )}
              {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="facts.ward"
          render={({ field }) => (
            <Field>
              <FieldLabel>Xã / phường (tùy chọn)</FieldLabel>
              <Input {...field} placeholder="VD: Phường Tân Phú" />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="facts.completedPrecision"
          render={({ field }) => (
            <Field>
              <FieldLabel>Độ chính xác của ngày hoàn thành</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRECISION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {completedAt
                  ? "Đã có ngày ở ô \"Ngày hoàn thành\" phía trên. Chọn mức chính xác (chỉ biết tháng thì chọn \"tháng/năm\", ngày 01 chỉ là chỗ giữ)."
                  : "Chưa có ngày: giữ \"Chưa rõ\" thay vì để mặc định."}
              </FieldDescription>
            </Field>
          )}
        />
        <div>
          <p className="type-label">Tình trạng thiết bị</p>
          <p className="type-body-sm">{condition ? CONDITION_LABEL[condition] : "Chưa chọn thiết bị"}</p>
          <p className="type-legal text-muted-foreground">
            Lấy từ tab chọn thiết bị (mỗi thiết bị gắn &quot;mới&quot; hoặc &quot;đã qua sử dụng&quot;), hiển thị công khai thành nhãn trên trang dự án.
          </p>
        </div>
      </div>

      <BrandsField form={form} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <NumberFact form={form} name="facts.indoorUnits" label="Số dàn lạnh / cửa gió" hint="Bắt buộc để xuất bản" />
        <NumberFact form={form} name="facts.capacityHp" label="Tổng công suất (HP)" step="0.5" />
        <NumberFact form={form} name="facts.airflowM3h" label="Lưu lượng gió (m³/h)" hint="Hệ khí tươi" />
        <NumberFact form={form} name="facts.areaM2" label="Diện tích (m²)" step="0.5" hint="Chỉ khi có hồ sơ" />
        <NumberFact form={form} name="facts.floors" label="Số tầng" />
        <NumberFact form={form} name="facts.durationDays" label="Thời gian thi công (ngày)" hint="Theo biên bản nghiệm thu" />
        <NumberFact form={form} name="facts.warrantyMonths" label="Bảo hành (tháng)" hint="Tùy từng dự án" />
      </div>

      <div className="space-y-4 border-t pt-4">
        <p className="type-label">Chủ đầu tư</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            control={form.control}
            name="facts.clientKind"
            render={({ field }) => (
              <Field>
                <FieldLabel>Loại khách hàng</FieldLabel>
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Chưa chọn (coi như cá nhân)</SelectItem>
                    <SelectItem value="person">Cá nhân</SelectItem>
                    <SelectItem value="business">Doanh nghiệp</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <div className={cn("space-y-2", clientKind === "business" && "opacity-60")}>
            <p className="type-label">Đồng ý hiển thị tên</p>
            <label className="flex items-center gap-2 type-body-sm">
              <input
                type="checkbox"
                checked={!!consentAt}
                disabled={clientKind === "business"}
                onChange={(e) =>
                  form.setValue("facts.clientConsentAt", e.target.checked ? new Date().toISOString() : null, {
                    shouldDirty: true,
                  })
                }
              />
              Khách cá nhân đã đồng ý ghi tên (Zalo/văn bản)
            </label>
            <Controller
              control={form.control}
              name="facts.clientConsentNote"
              render={({ field }) => (
                <Input {...field} disabled={clientKind === "business"} placeholder="Ghi chú: ngày, kênh xác nhận" />
              )}
            />
            <p className="type-legal text-muted-foreground">
              Tên khách cá nhân chỉ hiện công khai khi đã tick. Doanh nghiệp luôn hiện. Ghi chú chỉ nhân viên thấy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
