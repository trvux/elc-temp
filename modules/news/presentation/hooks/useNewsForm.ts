import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createClient } from "@/shared/lib/supabase/client";
import { convertToWebP } from "@/shared/lib/image";
import { extractTitleFromHtml, generateSlug } from "@/shared/lib/utils";

import { News, createNewsSchema } from "../../domain";
import { createNewsAction, updateNewsAction } from "../actions";

export type NewsFormValues = {
  title: string;
  slug: string;
  image: string;
  content: string;
  isPublished: boolean;
  orderIndex: number;
};

export function useNewsForm(
  editingNews: News | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const form = useForm<NewsFormValues>({
    resolver: standardSchemaResolver(createNewsSchema as any) as any,
    defaultValues: {
      title: "",
      slug: "",
      image: "",
      content: "",
      isPublished: true,
      orderIndex: 0,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: NewsFormValues) => {
      if (editingNews) {
        return updateNewsAction({
          ...values,
          id: editingNews.id,
        } as any);
      }
      return createNewsAction(values as any);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const webpFile = await convertToWebP(file);
      const fileName = `news/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.webp`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, webpFile, { contentType: "image/webp" });

      if (error) throw error;

      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      form.setValue("image", data.publicUrl);
      toast.success("Đã tải lên ảnh đại diện");
    } catch (error) {
      toast.error("Lỗi tải ảnh");
    } finally {
      setUploading(false);
    }
  };

  const handleContentChange = (val: any) => {
    form.setValue("content", val);
    const title = extractTitleFromHtml(val);
    if (title) {
      form.setValue("title", title);
      if (!editingNews || !form.getValues("slug")) {
        form.setValue("slug", generateSlug(title));
      }
    }
  };

  return {
    form,
    saveMutation,
    handleImageUpload,
    uploading,
    handleContentChange,
    supabase,
  };
}
