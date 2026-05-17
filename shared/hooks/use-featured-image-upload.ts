import { useState, useCallback } from "react";
import { UseFormSetValue, FieldValues, Path, PathValue } from "react-hook-form";
import { toast } from "sonner";
import { convertToWebP } from "@/shared/lib/image";
import { createClient } from "@/shared/lib/supabase/client";

interface UseFeaturedImageUploadProps<TFieldValues extends FieldValues> {
  setValue: UseFormSetValue<TFieldValues>;
  imageField: Path<TFieldValues>;
  folderPath: string;
  bucketName?: string;
}

export function useFeaturedImageUpload<TFieldValues extends FieldValues>({
  setValue,
  imageField,
  folderPath,
  bucketName = "images",
}: UseFeaturedImageUploadProps<TFieldValues>) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);

      try {
        const webpFile = await convertToWebP(file);
        const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const fileName = `${folderPath}/${uniqueId}.webp`;

        const { error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, webpFile, { contentType: "image/webp" });

        if (error) throw error;

        const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        setValue(imageField, data.publicUrl as PathValue<TFieldValues, Path<TFieldValues>>, {
          shouldDirty: true,
          shouldValidate: true,
        });
        toast.success("Đã tải lên ảnh đại diện");
      } catch (error) {
        console.error("Lỗi tải ảnh:", error);
        toast.error("Lỗi tải ảnh");
      } finally {
        setUploading(false);
      }
    },
    [setValue, imageField, folderPath, bucketName, supabase]
  );

  return {
    uploading,
    handleImageUpload,
  };
}
