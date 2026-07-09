"use client";

import { Button } from "@/shared/components/ui/button";
import { ImageUpload } from "@/shared/components/ui/image-upload";
import { Input } from "@/shared/components/ui/input";
import { X } from "@phosphor-icons/react";
import Image from "next/image";
import { Controller, UseFormReturn } from "react-hook-form";
import type { ImageAsset } from "@/shared/lib/image-asset";
import { ProductFormValues } from "../../hooks/useProductForm";

interface ProductGalleryTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductGalleryTab({ form }: ProductGalleryTabProps) {
  return (
    <>
      <Controller
        control={form.control}
        name="images"
        render={({ field }) => {
          const images: ImageAsset[] = field.value || [];
          return (
            <div className="space-y-4">
              <ImageUpload
                value=""
                onChange={(url) => {
                  if (url) {
                    field.onChange([...images, { url }]);
                  }
                }}
                aspectRatio={3.5}
                folderPath="products"
              />

              {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="group relative bg-background rounded-lg border overflow-hidden"
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={img.url}
                          alt={img.alt || ""}
                          fill
                          className="object-contain p-2"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 rounded-full shadow-lg"
                            onClick={() => {
                              const next = [...images];
                              next.splice(i, 1);
                              field.onChange(next);
                            }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                      <Input
                        value={img.alt || ""}
                        onChange={(e) => {
                          const next = [...images];
                          next[i] = { ...next[i], alt: e.target.value };
                          field.onChange(next);
                        }}
                        placeholder="Mô tả ảnh (alt text)"
                        className="rounded-none border-0 border-t text-xs h-8"
                      />
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
          );
        }}
      />
    </>
  );
}
