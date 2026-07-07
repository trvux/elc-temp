import { useState, useCallback } from "react";
import { UseFormSetValue, FieldValues, Path, PathValue } from "react-hook-form";
import { toast } from "sonner";
import { convertToWebP } from "@/shared/lib/image";
import { uploadImageFile } from "@/shared/lib/upload-image";

interface UseFeaturedImageUploadProps<TFieldValues extends FieldValues> {
  setValue: UseFormSetValue<TFieldValues>;
  imageField: Path<TFieldValues>;
  folderPath: string;
}

export function useFeaturedImageUpload<TFieldValues extends FieldValues>({
  setValue,
  imageField,
  folderPath,
}: UseFeaturedImageUploadProps<TFieldValues>) {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);

      try {
        const webpFile = await convertToWebP(file);
        const url = await uploadImageFile(webpFile, folderPath, webpFile.name);
        setValue(imageField, url as PathValue<TFieldValues, Path<TFieldValues>>, {
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
    [setValue, imageField, folderPath]
  );

  return {
    uploading,
    handleImageUpload,
  };
}
