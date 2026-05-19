import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";

import { createClient } from "@/shared/lib/supabase/client";
import { useTiptapTitleSlugSync } from "@/shared/hooks/use-tiptap-title-slug-sync";

import { Page, createPageSchema, Json } from "../../domain";
import { createPageAction, updatePageAction } from "../actions";

export type PageFormValues = {
  title: string;
  slug: string;
  content: unknown;
  isPublished: boolean;
  metaTitle: string;
  metaDescription: string;
};

export function usePageForm(
  editingPage: Page | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const form = useForm<PageFormValues>({
    resolver: standardSchemaResolver(createPageSchema) as unknown as Resolver<PageFormValues>,
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      isPublished: true,
      metaTitle: "",
      metaDescription: "",
    },
  });

  const { handleContentChange } = useTiptapTitleSlugSync({
    setValue: form.setValue,
    getValues: form.getValues,
    contentField: "content",
    titleField: "title",
    slugField: "slug",
    isEditMode: !!editingPage,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: PageFormValues) => {
      const payload = {
        ...values,
        content: JSON.parse(JSON.stringify(values.content)) as Json,
      };
      if (editingPage) {
        return updatePageAction({
          ...payload,
          id: editingPage.id,
        });
      }
      return createPageAction(payload);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(editingPage ? "Đã cập nhật trang" : "Đã tạo trang");
      onClose();
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });

  return {
    form,
    saveMutation,
    handleContentChange,
    supabase,
  };
}
