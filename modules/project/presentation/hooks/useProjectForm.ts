import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";

import { createClient } from "@/shared/lib/supabase/client";
import { convertToWebP } from "@/shared/lib/image";
import { useTiptapTitleSlugSync } from "@/shared/hooks/use-tiptap-title-slug-sync";


import { createProjectSchema, ProjectWithCategory, Json } from "../../domain";
import { createProjectAction, updateProjectAction } from "../actions";

export type ProjectFormValues = {
  title: string;
  slug: string;
  description: unknown;
  images: string[];
  isFeatured: boolean;
  isPublished: boolean;
  metaTitle: string;
  metaDescription: string;
  orderIndex: number;
  categoryId: string;
  serviceTypeId: string;
  categoryIds: string[];
};

export function useProjectForm(
  activeProject: ProjectWithCategory | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const form = useForm<ProjectFormValues>({
    resolver: standardSchemaResolver(createProjectSchema) as unknown as Resolver<ProjectFormValues>,
    defaultValues: {
      title: "",
      slug: "",
      description: null,
      categoryId: "00000000-0000-0000-0000-000000000000",
      serviceTypeId: "",
      categoryIds: [],
      images: [],
      isPublished: true,
      isFeatured: false,
      metaTitle: "",
      metaDescription: "",
      orderIndex: 0,
    },
  });

  const { handleContentChange } = useTiptapTitleSlugSync({
    setValue: form.setValue,
    getValues: form.getValues,
    contentField: "description",
    titleField: "title",
    slugField: "slug",
    isEditMode: activeProject !== "new",
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      const payload = {
        ...values,
        description: JSON.parse(JSON.stringify(values.description)) as Json,
        serviceTypeId: values.serviceTypeId || null,
        categoryIds: values.categoryIds || [],
      };
      console.log("CLIENT-SIDE FORM SUBMITTING PAYLOAD:", JSON.stringify(payload.description, null, 2));
      if (activeProject && activeProject !== "new") {
        return updateProjectAction({
          ...payload,
          id: activeProject.id,
        });
      }
      return createProjectAction(payload);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeProject === "new" ? "Đã tạo dự án" : "Đã cập nhật dự án"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const webpFile = await convertToWebP(file);
        const fileName = `projects/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.webp`;
        const { error } = await supabase.storage
          .from("images")
          .upload(fileName, webpFile, { contentType: "image/webp" });
        
        if (error) throw error;
        
        const { data } = supabase.storage.from("images").getPublicUrl(fileName);
        uploaded.push(data.publicUrl);
      } catch (error) {
        toast.error(`Lỗi upload: ${file.name}`);
      }
    }
    
    const currentImages = form.getValues("images") || [];
    form.setValue("images", [...currentImages, ...uploaded]);
    setUploading(false);
    toast.success(`Đã upload ${uploaded.length} ảnh`);
  };

  return {
    form,
    saveMutation,
    handleUpload,
    handleContentChange,
    uploading,
    supabase,
  };
}
