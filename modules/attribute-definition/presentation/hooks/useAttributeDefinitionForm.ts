import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createAttributeDefinitionSchema, AttributeDefinition, CreateAttributeDefinitionInput, UpdateAttributeDefinitionInput } from "../../domain";
import {
  attachAttributeDefinitionCategoriesAction,
  createAttributeDefinitionAction,
  detachAttributeDefinitionCategoryAction,
  updateAttributeDefinitionAction,
} from "../actions";

export type AttributeDefinitionFormValues = z.infer<typeof createAttributeDefinitionSchema>;

export function useAttributeDefinitionForm(
  activeDefinition: AttributeDefinition | "new" | null,
  onClose: () => void
) {
  const queryClient = useQueryClient();

  const form = useForm<AttributeDefinitionFormValues>({
    // See useProductForm.ts for the same cast — z.coerce.number().default(...)
    // fields make standardSchemaResolver's inferred input/output types
    // diverge just enough that TS can't unify them without this.
    resolver: standardSchemaResolver(createAttributeDefinitionSchema) as unknown as Resolver<AttributeDefinitionFormValues>,
    defaultValues: {
      categoryIds: [],
      code: "",
      name: "",
      groupLabel: "",
      dataType: "text",
      unit: "",
      options: [],
      orderIndex: 0,
      isRequired: false,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: AttributeDefinitionFormValues) => {
      const categoryIds = values.categoryIds ?? [];

      if (activeDefinition && activeDefinition !== "new") {
        const res = await updateAttributeDefinitionAction({
          id: activeDefinition.id,
          name: values.name,
          groupLabel: values.groupLabel,
          unit: values.unit,
          options: values.options,
          orderIndex: values.orderIndex,
          isRequired: values.isRequired,
        } as UpdateAttributeDefinitionInput);
        if (res.error) return res;

        // categoryIds isn't part of Update's own payload — reconcile via
        // attach/detach so the form can still edit it in one submit.
        const before = new Set(activeDefinition.categoryIds);
        const after = new Set(categoryIds);
        const toAttach = categoryIds.filter((id) => !before.has(id));
        const toDetach = [...before].filter((id) => !after.has(id));
        if (toAttach.length > 0) {
          await attachAttributeDefinitionCategoriesAction(activeDefinition.id, toAttach);
        }
        for (const categoryId of toDetach) {
          await detachAttributeDefinitionCategoryAction(activeDefinition.id, categoryId);
        }
        return res;
      }

      const created = await createAttributeDefinitionAction(values as CreateAttributeDefinitionInput);
      if (created.error || !created.data) return created;
      if (categoryIds.length > 0) {
        await attachAttributeDefinitionCategoriesAction(created.data.id, categoryIds);
      }
      return created;
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        activeDefinition === "new" ? "Đã tạo thuộc tính" : "Đã cập nhật thuộc tính"
      );
      onClose();
      queryClient.invalidateQueries({ queryKey: ["attribute-definitions"] });
    },
  });

  return { form, saveMutation };
}
