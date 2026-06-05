import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useRef } from "react";
import { CreateServiceGroupInput, ServiceGroup } from "../../domain/types";
import { generateSlug } from "@/shared/lib/helpers";

const serviceGroupSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên nhóm dịch vụ"),
  slug: z.string().min(1, "Vui lòng nhập slug"),
  imageUrl: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
  categoryIds: z.array(z.string()).optional(),
});

type ServiceGroupFormValues = z.infer<typeof serviceGroupSchema>;

export function useServiceGroupForm(initialData?: ServiceGroup | null) {
  const form = useForm<ServiceGroupFormValues>({
    resolver: zodResolver(serviceGroupSchema),
    defaultValues: {
      name: "",
      slug: "",
      imageUrl: null,
      metaTitle: null,
      metaDescription: null,
      isFeatured: false,
      orderIndex: 0,
      categoryIds: [],
    },
  });

  const prevNameRef = useRef(initialData?.name || "");

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        slug: initialData.slug,
        imageUrl: initialData.imageUrl,
        metaTitle: initialData.metaTitle,
        metaDescription: initialData.metaDescription,
        isFeatured: initialData.isFeatured,
        orderIndex: initialData.orderIndex,
        categoryIds: initialData.categoryIds || [],
      });
      prevNameRef.current = initialData.name;
    } else {
      form.reset({
        name: "",
        slug: "",
        imageUrl: null,
        metaTitle: null,
        metaDescription: null,
        isFeatured: false,
        orderIndex: 0,
        categoryIds: [],
      });
      prevNameRef.current = "";
    }
  }, [initialData, form]);

  // Auto generate slug from name
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "name" && type === "change") {
        const newName = value.name || "";
        const prevName = prevNameRef.current || "";
        const currentSlug = form.getValues("slug") || "";
        const expectedPrevSlug = generateSlug(prevName);

        if (!currentSlug || currentSlug === expectedPrevSlug) {
          form.setValue("slug", generateSlug(newName), {
            shouldValidate: true,
          });
        }
        prevNameRef.current = newName;
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const getFormData = (): CreateServiceGroupInput => {
    return form.getValues();
  };

  return { form, getFormData };
}
