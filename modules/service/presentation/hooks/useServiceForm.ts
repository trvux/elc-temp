import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";

import { createClient } from "@/shared/lib/supabase/client";
import { useFeaturedImageUpload } from "@/shared/hooks/use-featured-image-upload";
import { useTiptapTitleSlugSync } from "@/shared/hooks/use-tiptap-title-slug-sync";

import { Service, createServiceSchema, Json } from "../../domain";
import { createServiceAction, updateServiceAction } from "../actions";

export type ServiceFormValues = {
  title: string;
  slug: string;
  image: string;
  content: unknown;
  isPublished: boolean;
  metaTitle: string;
  metaDescription: string;
  orderIndex: number;
};

export function useServiceForm(
  editingService: Service | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const form = useForm<ServiceFormValues>({
    resolver: standardSchemaResolver(createServiceSchema) as unknown as Resolver<ServiceFormValues>,
    defaultValues: {
      title: "",
      slug: "",
      image: "",
      content: "",
      isPublished: true,
      metaTitle: "",
      metaDescription: "",
      orderIndex: 0,
    },
  });

  const { uploading, handleImageUpload } = useFeaturedImageUpload<ServiceFormValues>({
    setValue: form.setValue,
    imageField: "image",
    folderPath: "services",
  });

  const { handleContentChange } = useTiptapTitleSlugSync({
    setValue: form.setValue,
    getValues: form.getValues,
    contentField: "content",
    titleField: "title",
    slugField: "slug",
    isEditMode: !!editingService,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      const payload = {
        ...values,
        content: JSON.parse(JSON.stringify(values.content)) as Json,
      };
      if (editingService) {
        return updateServiceAction({
          ...payload,
          id: editingService.id,
        });
      }
      return createServiceAction(payload);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(editingService ? "Đã cập nhật dịch vụ" : "Đã tạo dịch vụ");
      onClose();
      queryClient.invalidateQueries({ queryKey: ["services"] });
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
