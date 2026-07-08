import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { generateSlug } from "@/shared/lib/helpers";

import { createAuthorSchema, Author, CreateAuthorInput, UpdateAuthorInput } from "../../domain";
import { createAuthorAction, updateAuthorAction } from "../actions";

export type AuthorFormValues = z.infer<typeof createAuthorSchema>;

export function useAuthorForm(
  activeAuthor: Author | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();

  const form = useForm<AuthorFormValues>({
    resolver: standardSchemaResolver(createAuthorSchema),
    defaultValues: {
      name: "",
      slug: "",
      avatarUrl: "",
      bio: "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: AuthorFormValues) => {
      if (activeAuthor && activeAuthor !== "new") {
        return updateAuthorAction({
          ...values,
          id: activeAuthor.id,
        } as UpdateAuthorInput);
      }
      return createAuthorAction(values as CreateAuthorInput);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeAuthor === "new" ? "Đã tạo tác giả" : "Đã cập nhật tác giả"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["authors"] });
    },
  });

  const onNameChange = (name: string) => {
    const currentSlug = form.getValues("slug");
    const oldName = form.getValues("name");
    form.setValue("name", name);
    if (activeAuthor === "new" || currentSlug === generateSlug(oldName)) {
      form.setValue("slug", generateSlug(name));
    }
  };

  return {
    form,
    saveMutation,
    onNameChange,
  };
}
