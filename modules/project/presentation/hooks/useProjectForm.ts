import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";

import { convertToWebP } from "@/shared/lib/image";
import { uploadImageFile } from "@/shared/lib/upload-image";
import { useTiptapTitleSlugSync } from "@/shared/hooks/use-tiptap-title-slug-sync";


import { createProjectSchema, ProjectWithCategory, Json, Seo } from "../../domain";
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
  seo: Seo;
  orderIndex: number;
  categoryId: string;
  projectTypeId: string;
  serviceGroupId?: string;
  serviceIds: string[];
  categories: { id: string; condition: "new" | "used" }[];
};

export function useProjectForm(
  activeProject: ProjectWithCategory | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: standardSchemaResolver(createProjectSchema) as unknown as Resolver<ProjectFormValues>,
    defaultValues: {
      title: "",
      slug: "",
      description: null,
      categoryId: "00000000-0000-0000-0000-000000000000",
      projectTypeId: "",
      serviceGroupId: "",
      serviceIds: [],
      categories: [],
      images: [],
      isPublished: true,
      isFeatured: false,
      metaTitle: "",
      metaDescription: "",
      seo: { title: "", description: "", noindex: false },
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
      const payloadValues = { ...values };
      delete payloadValues.serviceGroupId;
      const payload = {
        ...payloadValues,
        description: JSON.parse(JSON.stringify(payloadValues.description)) as Json,
        projectTypeId: payloadValues.projectTypeId || null,
        serviceIds: payloadValues.serviceIds || [],
        categories: payloadValues.categories || [],
      };

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
        const url = await uploadImageFile(webpFile, "projects", webpFile.name);
        uploaded.push(url);
      } catch {
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
  };
}
