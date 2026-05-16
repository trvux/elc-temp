import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createClient } from "@/shared/lib/supabase/client";
import { convertToWebP } from "@/shared/lib/image";
import { extractTitleFromHtml, generateSlug } from "@/shared/lib/utils";

import { Category } from "@/modules/category/domain/types";
import { createProjectSchema, ProjectWithCategory, Json } from "../../domain";
import { createProjectAction, updateProjectAction } from "../actions";

export type ProjectFormValues = {
  title: string;
  slug: string;
  description: unknown;
  images: string[];
  isFeatured: boolean;
  isPublished: boolean;
  orderIndex: number;
  categoryId: string;
};

export function useProjectForm(
  activeProject: ProjectWithCategory | "new" | null,
  onClose: () => void,
  categories: Category[] = []
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const form = useForm<ProjectFormValues>({
    resolver: standardSchemaResolver(createProjectSchema as any) as any,
    defaultValues: {
      title: "",
      slug: "",
      description: null,
      categoryId: "",
      images: [],
      isPublished: true,
      isFeatured: false,
      orderIndex: 0,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      const payload = {
        ...values,
        description: values.description as Json,
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

  const handleDescriptionChange = (val: any) => {
    form.setValue("description", val);
    const extractedTitle = extractTitleFromHtml(val);
    form.setValue("title", extractedTitle);

    // Auto-slug logic
    let namePart = extractedTitle.toLowerCase();
    const catId = form.getValues("categoryId");
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      const catName = cat.name.toLowerCase();
      const parentCat = categories.find((c) => c.id === cat.parentId);
      const parentName = parentCat?.name.toLowerCase();

      if (parentName && namePart.startsWith(parentName)) {
        namePart = namePart.replace(parentName, "").trim();
      }
      if (catName && namePart.startsWith(catName)) {
        namePart = namePart.replace(catName, "").trim();
      }
    }

    if (activeProject === "new" || !form.getValues("slug")) {
      form.setValue("slug", generateSlug(namePart));
    }
  };

  return {
    form,
    saveMutation,
    handleUpload,
    uploading,
    handleDescriptionChange,
    supabase,
  };
}
