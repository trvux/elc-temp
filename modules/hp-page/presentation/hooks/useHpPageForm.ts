import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { convertToWebP } from "@/shared/lib/image";
import { uploadImageFile } from "@/shared/lib/upload-image";
import { generateSlug } from "@/shared/lib/helpers";

import { createHpPageSchema, HpPage, CreateHpPageInput, UpdateHpPageInput } from "../../domain";
import { createHpPageAction, updateHpPageAction } from "../actions";

export type HpPageFormValues = z.infer<typeof createHpPageSchema>;

export function useHpPageForm(
  activePage: HpPage | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const form = useForm<HpPageFormValues>({
    resolver: standardSchemaResolver(createHpPageSchema),
    defaultValues: {
      name: "",
      slug: "",
      imageUrl: "",
      orderIndex: 0,
      metaTitle: "",
      metaDescription: "",
      content: "",
      attributeCode: "phan_khuc_hp",
      attributeValues: [],
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: HpPageFormValues) => {
      if (activePage && activePage !== "new") {
        return updateHpPageAction({
          ...values,
          id: activePage.id,
        } as UpdateHpPageInput);
      }
      return createHpPageAction(values as CreateHpPageInput);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activePage === "new" ? "Đã tạo trang công suất" : "Đã cập nhật trang công suất"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["hp-pages"] });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const webpFile = await convertToWebP(file);
      const url = await uploadImageFile(webpFile, "hp-pages", webpFile.name);
      form.setValue("imageUrl", url);
      toast.success("Đã tải ảnh lên thành công");
    } catch {
      toast.error("Lỗi upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  const onNameChange = (name: string) => {
    const currentSlug = form.getValues("slug");
    const oldName = form.getValues("name");
    form.setValue("name", name);
    if (activePage === "new" || currentSlug === generateSlug(oldName)) {
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
