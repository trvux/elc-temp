"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Upload, X, Spinner } from "@phosphor-icons/react";
import { toast } from "sonner";

import { AspectRatio } from "@/shared/components/ui/aspect-ratio";
import { Button } from "@/shared/components/ui/button";
import { convertToWebP } from "@/shared/lib/image";
import { uploadImageFileWithVariants } from "@/shared/lib/upload-image";
import { cn } from "@/shared/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  // Optional — fires alongside onChange with the full upload result
  // (including cropVariants, when the folder is one that generates them).
  // Callers that don't need it (the vast majority — avatars, page heroes,
  // branch/category photos, ...) can ignore this and nothing changes.
  onUploaded?: (result: { url: string; cropVariants: Record<string, string> | null }) => void;
  aspectRatio?: "1:1" | "16:9" | "19:9" | "2:1" | "portrait" | number;
  folderPath: string;
  maxSizeMB?: number;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onUploaded,
  aspectRatio = "16:9",
  folderPath,
  maxSizeMB = 5,
  className,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Resolve numeric ratio
  const ratio = React.useMemo(() => {
    if (typeof aspectRatio === "number") return aspectRatio;
    switch (aspectRatio) {
      case "1:1":
        return 1;
      case "16:9":
        return 16 / 9;
      case "19:9":
        return 19 / 9;
      case "2:1":
        return 2;
      case "portrait":
        return 2 / 3;
      default:
        return 16 / 9;
    }
  }, [aspectRatio]);

  const processAndUploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp tin hình ảnh");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Dung lượng ảnh vượt quá giới hạn ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      // Automatic WebP compression on client side
      const webpFile = await convertToWebP(file);
      const result = await uploadImageFileWithVariants(webpFile, folderPath, webpFile.name);
      onChange(result.url);
      onUploaded?.(result);
      toast.success("Tải ảnh lên thành công");
    } catch (err) {
      console.error("[ImageUpload] Error:", err);
      toast.error("Không thể tải ảnh lên, vui lòng thử lại");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  return (
    <div className={cn("w-full flex flex-col gap-4", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "w-full relative border border-dashed rounded-2xl overflow-hidden bg-muted/5 transition-all duration-200 group flex items-center justify-center",
          isDragOver && "border-primary bg-primary/5",
          !value && "hover:border-primary/60 hover:bg-muted/10",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <AspectRatio ratio={ratio}>
          {value ? (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2">
              <div className="relative w-full h-full">
                <Image
                  src={value}
                  alt="Uploaded image"
                  fill
                  className="object-contain rounded-xl"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-9 w-9 rounded-full shadow-lg"
                  disabled={disabled || uploading}
                  onClick={() => onChange("")}
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground/60 p-4">
              <div className="p-3 bg-muted rounded-full group-hover:scale-105 transition-transform duration-200">
                <Upload size={24} strokeWidth={1.5} className="text-muted-foreground" />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-sm font-semibold text-foreground">
                  Kéo thả ảnh hoặc nhấp để chọn tệp
                </span>
                <span className="text-xs text-muted-foreground">
                  Hỗ trợ định dạng PNG, JPG, WebP tối đa {maxSizeMB}MB
                </span>
              </div>
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept="image/*"
                disabled={disabled || uploading}
                onChange={handleFileChange}
              />
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 z-20">
              <Spinner className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider animate-pulse">
                Đang xử lý ảnh...
              </span>
            </div>
          )}
        </AspectRatio>
      </div>

      {value && (
        <Button
          variant="outline"
          type="button"
          className="w-full relative overflow-hidden"
          disabled={disabled || uploading}
        >
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept="image/*"
            onChange={handleFileChange}
          />
          Thay đổi ảnh đại diện
        </Button>
      )}
    </div>
  );
}
