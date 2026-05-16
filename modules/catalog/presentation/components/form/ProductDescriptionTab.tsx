"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import {
  Field,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/shared/components/ui/field";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";
import { createClient } from "@/shared/lib/supabase/client";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductDescriptionTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductDescriptionTab({ form }: ProductDescriptionTabProps) {
  const supabase = createClient();

  return (
    <FieldSet>
      <FieldLegend>Mô tả chi tiết sản phẩm</FieldLegend>
      <FieldGroup>
        <Field>
          <Controller
            control={form.control}
            name="description"
            render={({ field }) => (
              <TiptapEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Bắt đầu kể câu chuyện về sản phẩm của bạn..."
                uploadImage={async (file) => {
                  const fileName = `products/${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}.webp`;
                  const { error } = await supabase.storage
                    .from("images")
                    .upload(fileName, file, {
                      contentType: "image/webp",
                    });
                  if (error) throw error;
                  const { data } = supabase.storage
                    .from("images")
                    .getPublicUrl(fileName);
                  return data.publicUrl;
                }}
              />
            )}
          />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
