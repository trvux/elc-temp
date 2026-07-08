import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { generateSlug } from "@/shared/lib/helpers";

import { createTagSchema, Tag, CreateTagInput, UpdateTagInput } from "../../domain";
import { createTagAction, updateTagAction } from "../actions";

export type TagFormValues = z.infer<typeof createTagSchema>;

export function useTagForm(activeTag: Tag | "new" | null, onClose: () => void) {
  const queryClient = useQueryClient();

  const form = useForm<TagFormValues>({
    resolver: standardSchemaResolver(createTagSchema),
    defaultValues: { name: "", slug: "" },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: TagFormValues) => {
      if (activeTag && activeTag !== "new") {
        return updateTagAction({ ...values, id: activeTag.id } as UpdateTagInput);
      }
      return createTagAction(values as CreateTagInput);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(activeTag === "new" ? "Đã tạo thẻ" : "Đã cập nhật thẻ");
      onClose();
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const onNameChange = (name: string) => {
    const currentSlug = form.getValues("slug");
    const oldName = form.getValues("name");
    form.setValue("name", name);
    if (activeTag === "new" || currentSlug === generateSlug(oldName)) {
      form.setValue("slug", generateSlug(name));
    }
  };

  return { form, saveMutation, onNameChange };
}
