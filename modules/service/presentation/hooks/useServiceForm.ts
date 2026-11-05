import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState, useRef } from "react";
import { CreateServiceInput, ServiceWithRelations } from "../../domain/types";
import { generateSlug } from "@/shared/lib/helpers";

const imageAssetSchema = z.object({
  url: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

const serviceSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tên dịch vụ"),
  titleAlign: z.enum(["left", "center", "right"]),
  slug: z.string().min(1, "Vui lòng nhập slug"),
  line: z.enum(["thi-cong", "dich-vu"]),
  labels: z.array(z.string()).optional(),
  // What the customer should send in the Zalo chat so staff can quote; one per line.
  briefPrompts: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  content: z.any().nullable().optional(),
  images: z.array(imageAssetSchema).optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
}).superRefine((values, ctx) => {
  // SEO/GEO rule: an image on a public service page needs an alt (screen
  // readers, image search) and a caption (shown under the image and read by
  // answer engines). Drafts may stay incomplete; publishing may not.
  if (!values.isPublished) return;
  const incomplete = (values.images ?? []).some(
    (img) => !img.alt?.trim() || !img.caption?.trim(),
  );
  if (incomplete) {
    ctx.addIssue({
      code: "custom",
      path: ["images"],
      message: "Ảnh đại diện cần có alt và caption trước khi công khai dịch vụ.",
    });
  }
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export function useServiceForm(initialData?: ServiceWithRelations | null) {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      titleAlign: "left",
      slug: "",
      line: "dich-vu",
      labels: [],
      briefPrompts: [],
      description: null,
      content: null,
      images: [],
      metaTitle: null,
      metaDescription: null,
      isPublished: true,
      orderIndex: 0,
    },
  });

  const [labelInput, setLabelInput] = useState("");
  const prevTitleRef = useRef(initialData?.title || "");

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        titleAlign: initialData.titleAlign,
        slug: initialData.slug,
        line: initialData.line,
        labels: initialData.labels || [],
        briefPrompts: initialData.briefPrompts,
        description: initialData.description,
        content: initialData.content,
        images: initialData.images,
        metaTitle: initialData.metaTitle,
        metaDescription: initialData.metaDescription,
        isPublished: initialData.isPublished,
        orderIndex: initialData.orderIndex,
      });
      prevTitleRef.current = initialData.title;
    } else {
      form.reset({
        title: "",
        titleAlign: "left",
        slug: "",
        line: "dich-vu",
        labels: [],
        briefPrompts: [],
        description: null,
        content: null,
        images: [],
        metaTitle: null,
        metaDescription: null,
        isPublished: true,
        orderIndex: 0,
      });
      prevTitleRef.current = "";
    }
  }, [initialData, form]);

  // Auto generate slug from title
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "title" && type === "change") {
        const newTitle = value.title || "";
        const prevTitle = prevTitleRef.current || "";
        const currentSlug = form.getValues("slug") || "";
        const expectedPrevSlug = generateSlug(prevTitle);

        if (!currentSlug || currentSlug === expectedPrevSlug) {
          form.setValue("slug", generateSlug(newTitle), {
            shouldValidate: true,
          });
        }
        prevTitleRef.current = newTitle;
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
      titleAlign: values.titleAlign,
      slug: values.slug,
      line: values.line,
      labels: values.labels,
      briefPrompts: values.briefPrompts,
      description: values.description,
      content: values.content,
      images: values.images,
      metaTitle: values.metaTitle,
      metaDescription: values.metaDescription,
      isPublished: values.isPublished,
      orderIndex: values.orderIndex,
    };
  };

  return { form, getFormData, labelInput, setLabelInput, addLabel, removeLabel };
}
