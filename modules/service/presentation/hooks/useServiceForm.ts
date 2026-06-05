import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { CreateServiceInput, ServiceWithRelations } from "../../domain/types";
import { generateSlug } from "@/shared/lib/helpers";

const serviceSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tên dịch vụ"),
  slug: z.string().min(1, "Vui lòng nhập slug"),
  groupId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  
  // Pricing mode: "price" or "text"
  priceMode: z.enum(["price", "text"]),
  
  originalPrice: z.number().nullable().optional(),
  discountPercent: z.number().min(0).max(100).nullable().optional(),
  priceDisplayText: z.string().nullable().optional(),
  
  labels: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  content: z.any().nullable().optional(),
  image: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export function useServiceForm(initialData?: ServiceWithRelations | null) {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      slug: "",
      groupId: null,
      categoryId: null,
      priceMode: "price",
      originalPrice: null,
      discountPercent: null,
      priceDisplayText: null,
      labels: [],
      description: null,
      content: null,
      image: null,
      metaTitle: null,
      metaDescription: null,
      isFeatured: false,
      isPublished: true,
      orderIndex: 0,
    },
  });

  const [labelInput, setLabelInput] = useState("");

  useEffect(() => {
    if (initialData) {
      const mode = initialData.priceDisplayText ? "text" : "price";
      form.reset({
        title: initialData.title,
        slug: initialData.slug,
        groupId: initialData.groupId,
        categoryId: initialData.categoryId,
        priceMode: mode,
        originalPrice: initialData.originalPrice,
        discountPercent: initialData.discountPercent,
        priceDisplayText: initialData.priceDisplayText,
        labels: initialData.labels || [],
        description: initialData.description,
        content: initialData.content,
        image: initialData.image,
        metaTitle: initialData.metaTitle,
        metaDescription: initialData.metaDescription,
        isFeatured: initialData.isFeatured,
        isPublished: initialData.isPublished,
        orderIndex: initialData.orderIndex,
      });
    } else {
      form.reset({
        title: "",
        slug: "",
        groupId: null,
        categoryId: null,
        priceMode: "price",
        originalPrice: null,
        discountPercent: null,
        priceDisplayText: null,
        labels: [],
        description: null,
        content: null,
        image: null,
        metaTitle: null,
        metaDescription: null,
        isFeatured: false,
        isPublished: true,
        orderIndex: 0,
      });
    }
  }, [initialData, form]);

  // Auto generate slug from title
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "title" && type === "change") {
        if (!initialData) {
          form.setValue("slug", generateSlug(value.title || ""), {
            shouldValidate: true,
          });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, initialData]);

  const addLabel = () => {
    if (labelInput.trim() === "") return;
    const currentLabels = form.getValues("labels") || [];
    if (!currentLabels.includes(labelInput.trim())) {
      form.setValue("labels", [...currentLabels, labelInput.trim()]);
    }
    setLabelInput("");
  };

  const removeLabel = (labelToRemove: string) => {
    const currentLabels = form.getValues("labels") || [];
    form.setValue(
      "labels",
      currentLabels.filter((l) => l !== labelToRemove)
    );
  };

  const getFormData = (): CreateServiceInput => {
    const values = form.getValues();
    
    return {
      title: values.title,
      slug: values.slug,
      groupId: values.groupId,
      categoryId: values.categoryId,
      originalPrice: values.priceMode === "price" ? values.originalPrice : null,
      discountPercent: values.priceMode === "price" ? values.discountPercent : null,
      priceDisplayText: values.priceMode === "text" ? values.priceDisplayText : null,
      labels: values.labels,
      description: values.description,
      content: values.content,
      image: values.image,
      metaTitle: values.metaTitle,
      metaDescription: values.metaDescription,
      isFeatured: values.isFeatured,
      isPublished: values.isPublished,
      orderIndex: values.orderIndex,
    };
  };

  return { form, getFormData, labelInput, setLabelInput, addLabel, removeLabel };
}
