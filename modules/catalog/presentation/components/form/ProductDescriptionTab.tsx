"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Textarea } from "@/shared/components/ui/textarea";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";
import { uploadImageFile } from "@/shared/lib/upload-image";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductDescriptionTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductDescriptionTab({ form }: ProductDescriptionTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <Controller
        control={form.control}
        name="shortDescription"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Mô tả ngắn</FieldLabel>
            <Textarea
              {...field}
              value={field.value ?? ""}
              placeholder="Tóm tắt ngắn gọn về sản phẩm..."
              rows={3}
            />
            <FieldDescription>Dùng cho thẻ sản phẩm/đoạn trích — khác với mô tả chi tiết bên dưới.</FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="description"
        render={({ field }) => (
          <TiptapEditor
            value={field.value}
            onChange={field.onChange}
            placeholder="Bắt đầu kể câu chuyện về sản phẩm của bạn..."
            uploadImage={async (file) => uploadImageFile(file, "products")}
          />
        )}
      />
    </div>
  );
}
