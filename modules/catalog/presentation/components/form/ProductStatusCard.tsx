"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductStatusCardProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductStatusCard({ form }: ProductStatusCardProps) {
  return (
    <FieldGroup className="gap-5">
      <Controller
        control={form.control}
        name="isPublished"
        render={({ field }) => (
          <Field orientation="horizontal" className="justify-between border p-3 rounded-lg">
            <FieldLabel className="font-normal mb-0">Trạng thái hiển thị</FieldLabel>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="isFeatured"
        render={({ field }) => (
          <Field orientation="horizontal" className="justify-between border p-3 rounded-lg">
            <FieldLabel className="font-normal mb-0">Sản phẩm nổi bật</FieldLabel>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="orderIndex"
        render={({ field }) => (
          <Field>
            <FieldLabel>Thứ tự hiển thị</FieldLabel>
            <Input type="number" {...field} onFocus={(e) => e.target.select()} />
            <FieldDescription>Thứ tự sắp xếp hiển thị của sản phẩm</FieldDescription>
          </Field>
        )}
      />
    </FieldGroup>
  );
}
