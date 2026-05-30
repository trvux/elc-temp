import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useState } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { convertToWebP } from "@/shared/lib/image";
import { generateSlug } from "@/shared/lib/helpers";

import { createServiceTypeSchema, ServiceTypeWithCategories } from "../../domain";
import { createServiceTypeAction, updateServiceTypeAction } from "../actions";

export type ServiceTypeFormValues = {
  name: string;
  slug: string;
  image?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  orderIndex?: number;
  categoryIds?: string[];
};

export function useServiceTypeForm(
  activeServiceType: ServiceTypeWithCategories | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const form = useForm<ServiceTypeFormValues>({
    resolver: standardSchemaResolver(createServiceTypeSchema as any) as any,
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
    mutationFn: async (values: ServiceTypeFormValues) => {
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

      if (activeServiceType && activeServiceType !== "new") {
        return updateServiceTypeAction({
          id: activeServiceType.id,
          ...payload,
        });
      }
      return createServiceTypeAction(payload);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeServiceType === "new"
          ? "Đã tạo loại hình dịch vụ"
          : "Đã cập nhật loại hình dịch vụ"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["service-types"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const webpFile = await convertToWebP(file);
      const fileName = `service-types/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, webpFile, { contentType: "image/webp" });
      
      if (error) throw error;
      
      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      form.setValue("image", data.publicUrl, { shouldDirty: true, shouldValidate: true });
      toast.success("Đã tải lên ảnh đại diện SEO");
    } catch (error) {
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
