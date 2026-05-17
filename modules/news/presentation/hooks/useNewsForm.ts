import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";

import { createClient } from "@/shared/lib/supabase/client";
import { useFeaturedImageUpload } from "@/shared/hooks/use-featured-image-upload";
import { useTiptapTitleSlugSync } from "@/shared/hooks/use-tiptap-title-slug-sync";

import { News, createNewsSchema, Json } from "../../domain";
import { createNewsAction, updateNewsAction } from "../actions";

export type NewsFormValues = {
  title: string;
  slug: string;
  image: string;
  content: unknown;
  isPublished: boolean;
  orderIndex: number;
};

export function useNewsForm(
  editingNews: News | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const form = useForm<NewsFormValues>({
    resolver: standardSchemaResolver(createNewsSchema) as unknown as Resolver<NewsFormValues>,
    defaultValues: {
      title: "",
      slug: "",
      image: "",
      content: "",
      isPublished: true,
      orderIndex: 0,
    },
  });

  const { uploading, handleImageUpload } = useFeaturedImageUpload<NewsFormValues>({
    setValue: form.setValue,
    imageField: "image",
    folderPath: "news",
  });

  const { handleContentChange } = useTiptapTitleSlugSync({
    setValue: form.setValue,
    getValues: form.getValues,
    contentField: "content",
    titleField: "title",
    slugField: "slug",
    isEditMode: !!editingNews,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: NewsFormValues) => {
      const payload = {
        ...values,
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
    supabase,
  };
}
