"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductWarrantyCardProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductWarrantyCard({ form }: ProductWarrantyCardProps) {
  return (
    <FieldGroup className="gap-5">
      <Controller
        control={form.control}
        name="warrantyMonths"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Thời hạn bảo hành (tháng)</FieldLabel>
            <Input
              type="number"
              {...field}
              value={field.value ?? ""}
              placeholder="VD: 12"
              onFocus={(e) => e.target.select()}
              onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
            />
            <FieldDescription>Dùng để hiển thị chính xác trong câu hỏi thường gặp ở trang sản phẩm.</FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="warrantyTerms"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Điều kiện bảo hành</FieldLabel>
            <Textarea
              {...field}
              value={field.value ?? ""}
              placeholder="VD: Bảo hành chính hãng tại trung tâm ủy quyền, không áp dụng cho lỗi do người dùng..."
              className="min-h-[80px]"
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </FieldGroup>
  );
}
