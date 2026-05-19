import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { generateSlug } from "@/shared/lib/utils";
import {
  createCategorySchema,
  Category,
  CategoryType,
} from "../../domain";
import { createCategoryAction, updateCategoryAction } from "../actions";

export type CategoryFormValues = z.infer<typeof createCategorySchema>;

export function useCategoryForm(
  activeCategory: Category | "new" | null,
  onClose: () => void,
  categories: Category[] = []
) {
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormValues>({
    resolver: standardSchemaResolver(createCategorySchema as any) as any,
    defaultValues: {
      name: "",
      slug: "",
      type: "PRODUCT",
      parentId: null,
      metaTitle: "",
      metaDescription: "",
    },
  });

  const parentId = form.watch("parentId");
  const internalSlug = form.watch("slug");
  const type = form.watch("type");

  const fullSlug = useMemo(() => {
    if (!parentId) return internalSlug;
    const parent = categories.find((c) => c.id === parentId);
    if (!parent) return internalSlug;
    return `${parent.slug}-${internalSlug}`;
  }, [parentId, internalSlug, categories]);

  const saveMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const payload = { ...values, slug: fullSlug };
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
        activeCategory === "new" ? "Đã tạo danh mục" : "Đã cập nhật danh mục"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const onNameChange = (name: string) => {
    form.setValue("name", name);
    form.setValue("slug", generateSlug(name));
  };

  const getParentOptions = (forType: CategoryType) => {
    return categories.filter((c) => !c.parentId && c.type === forType);
  };

  return {
    form,
    saveMutation,
    fullSlug,
    onNameChange,
    getParentOptions,
    type,
    parentId,
  };
}
