"use client";

import { Controller, UseFormReturn } from "react-hook-form";
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
