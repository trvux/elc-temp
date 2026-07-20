"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import { Controller, UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { TiptapEditor } from "@/shared/components/ui/tiptap-editor";
import { uploadImageFile } from "@/shared/lib/upload-image";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductDescriptionTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductDescriptionTab({ form }: ProductDescriptionTabProps) {
  return (
    <div className="flex flex-col gap-8">
      <Controller
        control={form.control}
        name="highlights"
        render={({ field }) => {
          const items = field.value ?? [];
          return (
            <Field>
              <FieldLabel>Đặc điểm nổi bật</FieldLabel>
              <div className="flex flex-col gap-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const next = [...items];
                        next[i] = e.target.value;
                        field.onChange(next);
                      }}
                      placeholder="VD: Công suất làm lạnh 1 HP phù hợp phòng dưới 15m²"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => field.onChange(items.filter((_, idx) => idx !== i))}
                    >
                      <Trash />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => field.onChange([...items, ""])}
                >
                  <Plus /> Thêm đặc điểm
                </Button>
              </div>
            </Field>
          );
        }}
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
