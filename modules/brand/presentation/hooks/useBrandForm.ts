import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { convertToWebP } from "@/shared/lib/image";
import { createClient } from "@/shared/lib/supabase/client";
import { generateSlug } from "@/shared/lib/helpers";

import { createBrandSchema, Brand, CreateBrandInput, UpdateBrandInput } from "../../domain";
import { createBrandAction, updateBrandAction } from "../actions";

export type BrandFormValues = z.infer<typeof createBrandSchema>;

export function useBrandForm(
  activeBrand: Brand | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const form = useForm<BrandFormValues>({
    resolver: standardSchemaResolver(createBrandSchema),
    defaultValues: {
      name: "",
      slug: "",
      logoUrl: "",
      isFeatured: false,
      orderIndex: 0,
      metaTitle: "",
      metaDescription: "",
      content: "",
      faq: [],
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: BrandFormValues) => {
      if (activeBrand && activeBrand !== "new") {
        return updateBrandAction({
          ...values,
          id: activeBrand.id,
        } as UpdateBrandInput);
      }
      return createBrandAction(values as CreateBrandInput);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeBrand === "new" ? "Đã tạo thương hiệu" : "Đã cập nhật thương hiệu"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const webpFile = await convertToWebP(file);
      const fileName = `brands/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.webp`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, webpFile, { contentType: "image/webp" });

      if (error) throw error;

      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      form.setValue("logoUrl", data.publicUrl);
      toast.success("Đã tải logo lên thành công");
    } catch {
      toast.error("Lỗi upload logo");
    } finally {
      setUploading(false);
    }
  };

  const onNameChange = (name: string) => {
    const currentSlug = form.getValues("slug");
    const oldName = form.getValues("name");
    form.setValue("name", name);
    // Auto-gen slug nếu:
    // 1. Đang tạo mới, hoặc
    // 2. Đang sửa và slug hiện tại vẫn match với slug được gen từ name cũ
    //    (tức là user chưa tự sửa slug thủ công)
    if (activeBrand === "new" || currentSlug === generateSlug(oldName)) {
      form.setValue("slug", generateSlug(name));
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
