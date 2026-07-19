"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductSeoCardProps {
  form: UseFormReturn<ProductFormValues>;
}

// metaTitle/metaDescription existed in the schema/API payload already (see
// validators.ts, useProductForm.ts) but had no editable field anywhere in
// the admin — this card is what was actually missing, not a re-styling of
// something that existed. Same field pattern as
// CategoryManagement.tsx's SEO section, for consistency across admin forms.
export function ProductSeoCard({ form }: ProductSeoCardProps) {
  const name = form.watch("name");

  return (
    <FieldGroup className="gap-5">
      <Controller
        control={form.control}
        name="metaTitle"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Tiêu đề SEO</FieldLabel>
            <Input {...field} value={field.value || ""} placeholder={name || "Để trống sẽ dùng tên sản phẩm..."} />
            <FieldDescription>{(field.value || "").length}/70 ký tự</FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="metaDescription"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Mô tả SEO</FieldLabel>
            <Textarea {...field} value={field.value || ""} placeholder="Tóm tắt ngắn gọn hiện trên kết quả tìm kiếm..." className="min-h-20" />
            <FieldDescription>{(field.value || "").length}/160 ký tự</FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </FieldGroup>
  );
}
