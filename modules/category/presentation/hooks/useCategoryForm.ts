import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import { convertToWebP } from "@/shared/lib/image";
import { uploadImageFile } from "@/shared/lib/upload-image";
import { generateSlug } from "@/shared/lib/helpers";

import { createCategorySchema, Category } from "../../domain";
import { createCategoryAction, updateCategoryAction } from "../actions";

export type CategoryFormValues = {
  name: string;
  groupId?: string | null;
  slug: string;
  imageUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
  content?: unknown;
  faq?: Array<{ question: string; answer: string }> | null;
};

export function useCategoryForm(
  activeCategory: Category | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: standardSchemaResolver(createCategorySchema) as unknown as Resolver<CategoryFormValues>,
    defaultValues: {
      name: "",
      groupId: null,
      slug: "",
      imageUrl: "",
      metaTitle: "",
      metaDescription: "",
      isFeatured: false,
      orderIndex: 0,
      content: "",
      faq: [],
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const trimmed = values.name.trim();
      const formattedName = trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : "";
      const finalSlug = (values.slug || "").trim() || generateSlug(formattedName);
      
      const payload = {
        name: formattedName,
        slug: finalSlug,
        groupId: values.groupId || null,
        imageUrl: values.imageUrl || null,
        metaTitle: values.metaTitle || null,
        metaDescription: values.metaDescription || null,
        isFeatured: !!values.isFeatured,
        orderIndex: Number(values.orderIndex || 0),
        content: values.content || null,
        faq: values.faq || null,
      };

      if (activeCategory && activeCategory !== "new") {
        return updateCategoryAction({
          id: activeCategory.id,
          ...payload,
        });
      }
      return createCategoryAction(payload);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeCategory === "new" ? "Đã tạo danh mục mới" : "Đã cập nhật danh mục mới"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["categories-new"] });
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
      const url = await uploadImageFile(webpFile, "categories-new", webpFile.name);
      form.setValue("imageUrl", url);
      toast.success("Đã tải lên ảnh đại diện");
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
