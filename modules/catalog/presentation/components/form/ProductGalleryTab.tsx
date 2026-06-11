"use client";

import { Button } from "@/shared/components/ui/button";
import { FieldLegend, FieldSet } from "@/shared/components/ui/field";
import { ImageUpload } from "@/shared/components/ui/image-upload";
import { X } from "@phosphor-icons/react";
import Image from "next/image";
import { Controller, UseFormReturn } from "react-hook-form";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductGalleryTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductGalleryTab({ form }: ProductGalleryTabProps) {
  return (
    <FieldSet>
      <div className="flex items-center justify-between mb-4">
        <FieldLegend>Upload ảnh</FieldLegend>
      </div>

      <Controller
        control={form.control}
        name="images"
        render={({ field }) => (
          <div className="space-y-4">
            <ImageUpload
              value=""
              onChange={(url) => {
                if (url) {
                  field.onChange([...(field.value || []), url]);
                }
              }}
              aspectRatio={3.5}
              folderPath="products"
            />

            {field.value && field.value.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 mt-3">
                {field.value.map((url: string, i: number) => (
                  <div
                    key={i}
                    className="group relative aspect-square bg-background rounded-lg border overflow-hidden"
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 100px"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7 rounded-full shadow-lg"
                        onClick={() => {
                          const next = [...field.value];
                          next.splice(i, 1);
                          field.onChange(next);
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/5">
                <p className="text-xs font-bold">
                  Chưa có hình ảnh nào được tải lên
                </p>
              </div>
            )}
          </div>
        )}
      />
    </FieldSet>
  );
}
