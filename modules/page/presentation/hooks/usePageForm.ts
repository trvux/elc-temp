import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createClient } from "@/shared/lib/supabase/client";
import { convertToWebP } from "@/shared/lib/image";
import { extractTitleFromHtml, generateSlug } from "@/shared/lib/utils";

import { Page, createPageSchema } from "../../domain";
import { createPageAction, updatePageAction } from "../actions";

export type PageFormValues = {
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
};

export function usePageForm(
  editingPage: Page | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const form = useForm<PageFormValues>({
    resolver: standardSchemaResolver(createPageSchema as any) as any,
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      isPublished: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: PageFormValues) => {
      if (editingPage) {
        return updatePageAction({
          ...values,
          id: editingPage.id,
        } as any);
      }
      return createPageAction(values as any);
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

  const handleContentChange = (val: any) => {
    form.setValue("content", val);
    const title = extractTitleFromHtml(val);
    if (title) {
      form.setValue("title", title);
      if (!editingPage || !form.getValues("slug")) {
        form.setValue("slug", generateSlug(title));
      }
    }
  };

  return {
    form,
    saveMutation,
    handleContentChange,
    supabase,
  };
}
