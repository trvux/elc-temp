import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createClient } from "@/shared/lib/supabase/client";
import { extractTitleFromHtml, generateSlug } from "@/shared/lib/utils";

import { Branch, createBranchSchema, Json, CreateBranchInput, UpdateBranchInput } from "../../domain";
import { createBranchAction, updateBranchAction } from "../actions";
import type { z } from "zod";

export type BranchFormValues = z.infer<typeof createBranchSchema>;

export function useBranchForm(
  activeBranch: Branch | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const form = useForm<BranchFormValues>({
    resolver: standardSchemaResolver(createBranchSchema),
    defaultValues: {
      name: "",
      slug: "",
      address: "",
      phone: "",
      email: "",
      mapsUrl: "",
      mapsEmbed: "",
      description: "",
      isPublished: true,
      orderIndex: 0,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: BranchFormValues) => {
      const payload = {
        ...values,
        description: values.description as Json,
      };
      if (activeBranch && activeBranch !== "new") {
        return updateBranchAction({
          ...payload,
          id: activeBranch.id,
        } as UpdateBranchInput);
      }
      return createBranchAction(payload as CreateBranchInput);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeBranch === "new" ? "Đã tạo chi nhánh" : "Đã cập nhật chi nhánh"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Đã có lỗi xảy ra");
    },
  });

  const handleDescriptionChange = (val: string) => {
    form.setValue("description", val);
    const extractedTitle = extractTitleFromHtml(val);
    if (!form.getValues("name")) {
      form.setValue("name", extractedTitle);
    }
    if (!form.getValues("slug")) {
      form.setValue("slug", generateSlug(extractedTitle));
    }
  };

  return {
    form,
    saveMutation,
    handleDescriptionChange,
    supabase,
  };
}
