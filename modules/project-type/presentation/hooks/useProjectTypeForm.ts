import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { convertToWebP } from "@/shared/lib/image";
import { generateSlug } from "@/shared/lib/helpers";

import { createProjectTypeSchema, ProjectTypeWithCategories } from "../../domain";
import { createProjectTypeAction, updateProjectTypeAction } from "../actions";

export type ProjectTypeFormValues = {
  name: string;
  slug: string;
  image?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
  categoryIds?: string[];
};

export function useProjectTypeForm(
  activeProjectType: ProjectTypeWithCategories | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const form = useForm<ProjectTypeFormValues>({
    resolver: standardSchemaResolver(createProjectTypeSchema) as unknown as Resolver<ProjectTypeFormValues>,
    defaultValues: {
      name: "",
      slug: "",
      image: "",
      metaTitle: "",
      metaDescription: "",
      isFeatured: false,
      orderIndex: 0,
      categoryIds: [],
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ProjectTypeFormValues) => {
      const trimmed = values.name.trim();
      const formattedName = trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : "";
      const finalSlug = (values.slug || "").trim() || generateSlug(formattedName);

      const payload = {
        name: formattedName,
        slug: finalSlug,
        image: values.image || null,
        metaTitle: values.metaTitle || null,
        metaDescription: values.metaDescription || null,
        isFeatured: !!values.isFeatured,
        orderIndex: Number(values.orderIndex || 0),
        categoryIds: values.categoryIds || [],
      };

      if (activeProjectType && activeProjectType !== "new") {
        return updateProjectTypeAction({
          id: activeProjectType.id,
          ...payload,
        });
      }
      return createProjectTypeAction(payload);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeProjectType === "new"
          ? "Đã tạo loại hình công trình"
          : "Đã cập nhật loại hình công trình"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["project-types"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const webpFile = await convertToWebP(file);
      const fileName = `project-types/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, webpFile, { contentType: "image/webp" });
      
      if (error) throw error;
      
      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      form.setValue("image", data.publicUrl, { shouldDirty: true, shouldValidate: true });
      toast.success("Đã tải lên ảnh đại diện SEO");
    } catch {
      toast.error(`Lỗi upload: ${file.name}`);
    } finally {
      setUploading(false);
    }
  };

  const onNameChange = (newName: string) => {
    const currentName = form.getValues("name");
    const currentSlug = form.getValues("slug");
    
    form.setValue("name", newName);
    
    const previousNameSlug = generateSlug(currentName);
    if (!currentSlug || currentSlug === previousNameSlug) {
      form.setValue("slug", generateSlug(newName));
    }
  };

  return {
    form,
    saveMutation,
    handleUpload,
    uploading,
    onNameChange,
  };
}
