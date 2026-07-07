import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Branch, createBranchSchema, Json, CreateBranchInput, UpdateBranchInput } from "../../domain";
import { createBranchAction, updateBranchAction } from "../actions";
import type { z } from "zod";

export type BranchFormValues = z.infer<typeof createBranchSchema>;

export function useBranchForm(
  activeBranch: Branch | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();

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
      imageUrl: "",
      isPublished: true,
      metaTitle: "",
      metaDescription: "",
      orderIndex: 0,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: BranchFormValues) => {
      const payload = {
        ...values,
        description: JSON.parse(JSON.stringify(values.description)) as Json,
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
        activeBranch === "new" ? "Đã tạo cơ sở hạ tầng" : "Đã cập nhật cơ sở hạ tầng"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
      toast.error(message);
    },
  });

  return {
    form,
    saveMutation,
  };
}
