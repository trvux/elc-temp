"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import {
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/shared/components/ui/field";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductGalleryTabProps {
  form: UseFormReturn<ProductFormValues>;
  uploading: boolean;
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function ProductGalleryTab({
  form,
  uploading,
  handleUpload,
}: ProductGalleryTabProps) {
  return (
    <FieldSet>
      <div className="flex items-center justify-between mb-4">
        <FieldLegend>Hình ảnh sản phẩm</FieldLegend>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          asChild
        >
          <label className="cursor-pointer">
            <Input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Upload size={14} className="mr-2" />
            {uploading ? "Đang tải..." : "Thêm ảnh"}
          </label>
        </Button>
      </div>

      <Controller
        control={form.control}
        name="images"
        render={({ field }) => (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {(field.value || []).map((url: string, i: number) => (
              <div
                key={i}
                className="group relative aspect-square bg-background rounded-lg border overflow-hidden"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 120px"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7 rounded-full"
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
            {(!field.value || field.value.length === 0) && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-xl bg-muted/5">
                <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
                  Chưa có hình ảnh nào
                </p>
              </div>
            )}
          </div>
        )}
      />
    </FieldSet>
  );
}
