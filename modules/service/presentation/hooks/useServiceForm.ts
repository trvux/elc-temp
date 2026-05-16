import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createClient } from "@/shared/lib/supabase/client";
import { convertToWebP } from "@/shared/lib/image";
import { extractTitleFromHtml, generateSlug } from "@/shared/lib/utils";

import { Service, createServiceSchema } from "../../domain";
import { createServiceAction, updateServiceAction } from "../actions";

export type ServiceFormValues = {
  title: string;
  slug: string;
  image: string;
  content: string;
  isPublished: boolean;
  orderIndex: number;
};

export function useServiceForm(
  editingService: Service | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const form = useForm<ServiceFormValues>({
    resolver: standardSchemaResolver(createServiceSchema as any) as any,
    defaultValues: {
      title: "",
      slug: "",
      image: "",
      content: "",
      isPublished: true,
      orderIndex: 0,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      if (editingService) {
        return updateServiceAction({
          ...values,
          id: editingService.id,
        });
      }
      return createServiceAction(values);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const webpFile = await convertToWebP(file);
      const fileName = `services/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.webp`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, webpFile, { contentType: "image/webp" });

      if (error) throw error;

      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      form.setValue("image", data.publicUrl);
      toast.success("Đã tải lên ảnh đại diện");
    } catch (error) {
      toast.error("Lỗi tải ảnh");
    } finally {
      setUploading(false);
    }
  };

  const handleContentChange = (val: any) => {
    form.setValue("content", val);
    const title = extractTitleFromHtml(val);
    if (title) {
      form.setValue("title", title);
      if (!editingService || !form.getValues("slug")) {
        form.setValue("slug", generateSlug(title));
      }
    }
  };

  return {
    form,
    saveMutation,
    handleImageUpload,
    uploading,
    handleContentChange,
    supabase,
  };
}
