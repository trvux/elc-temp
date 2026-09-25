import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";

import { convertToWebP, getImageDimensions } from "@/shared/lib/image";
import { uploadImageFile } from "@/shared/lib/upload-image";

import { News, createNewsSchema, Json, ImageAsset, TitleAlign } from "../../domain";
import { createNewsAction, updateNewsAction } from "../actions";

// Mirrors shared/components/ui/image-upload.tsx's default — news doesn't
// use that component (its cover image lives inline in the form, not a
// generic ImageUpload slot), so the same limit is duplicated here.
const MAX_IMAGE_SIZE_MB = 5;

// Google Discover's large-image card format needs a wide-enough source
// image; below this it still shows in Discover, just not in that format.
// Non-technical editors often have no resize tool on hand, so this is a
// warning, not a block.
const RECOMMENDED_MIN_WIDTH = 1200;

export type NewsFormValues = {
  title: string;
  titleAlign: TitleAlign;
  slug: string;
  images: ImageAsset[];
  content: unknown;
  excerpt: string;
  categoryId: string;
  authorId: string;
  isPublished: boolean;
  metaTitle: string;
  metaDescription: string;
  orderIndex: number;
  tagIds: string[];
};

export function useNewsForm(
  editingNews: News | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const form = useForm<NewsFormValues>({
    resolver: standardSchemaResolver(createNewsSchema) as unknown as Resolver<NewsFormValues>,
    defaultValues: {
      title: "",
      titleAlign: "center",
      slug: "",
      images: [],
      content: "",
      excerpt: editingNews?.excerpt || "",
      categoryId: editingNews?.categoryId || "",
      authorId: editingNews?.authorId || "",
      isPublished: true,
      metaTitle: "",
      metaDescription: "",
      orderIndex: 0,
      tagIds: (editingNews?.tags || []).map((t) => t.id),
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Dung lượng ảnh vượt quá giới hạn ${MAX_IMAGE_SIZE_MB}MB`);
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const { width } = await getImageDimensions(file);
      if (width < RECOMMENDED_MIN_WIDTH) {
        toast.warning(
          `Ảnh rộng ${width}px, nên dùng ảnh rộng từ ${RECOMMENDED_MIN_WIDTH}px trở lên để hiển thị đẹp trên Google Discover`
        );
      }

      const webpFile = await convertToWebP(file);
      const url = await uploadImageFile(webpFile, "news", webpFile.name);
      form.setValue("images", [{ url }], { shouldDirty: true, shouldValidate: true });
      toast.success("Đã tải lên ảnh đại diện");
    } catch (error) {
      console.error("Lỗi tải ảnh:", error);
      toast.error("Lỗi tải ảnh");
    } finally {
      setUploading(false);
    }
  };

  const handleContentChange = (value: unknown) => {
    form.setValue("content", value, { shouldDirty: true, shouldValidate: true });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: NewsFormValues) => {
      const payload = {
        ...values,
        categoryId: values.categoryId || null,
        authorId: values.authorId || null,
        content: JSON.parse(JSON.stringify(values.content)) as Json,
      };
      if (editingNews) {
        return updateNewsAction({
          ...payload,
          id: editingNews.id,
        });
      }
      return createNewsAction(payload);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(editingNews ? "Đã cập nhật tin tức" : "Đã tạo tin tức");
      onClose();
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
  });

  return {
    form,
    saveMutation,
    handleImageUpload,
    handleContentChange,
    uploading,
  };
}
