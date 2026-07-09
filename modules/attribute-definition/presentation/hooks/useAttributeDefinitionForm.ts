import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createAttributeDefinitionSchema, AttributeDefinition, CreateAttributeDefinitionInput, UpdateAttributeDefinitionInput } from "../../domain";
import { createAttributeDefinitionAction, updateAttributeDefinitionAction } from "../actions";

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
      categoryId: null,
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
      if (activeDefinition && activeDefinition !== "new") {
        return updateAttributeDefinitionAction({
          id: activeDefinition.id,
          name: values.name,
          groupLabel: values.groupLabel,
          unit: values.unit,
          options: values.options,
          orderIndex: values.orderIndex,
          isRequired: values.isRequired,
        } as UpdateAttributeDefinitionInput);
      }
      return createAttributeDefinitionAction(values as CreateAttributeDefinitionInput);
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
