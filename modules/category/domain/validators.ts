import { z } from "zod";

export const categorySchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  name: z
    .string()
    .min(1, { message: "Tên danh mục không được để trống" })
    .max(100, { message: "Tên danh mục không được quá 100 ký tự" }),
  groupId: z.uuid({ message: "ID nhóm không đúng định dạng UUID" }).nullable().optional(),
  slug: z
    .string()
    .min(1, { message: "Slug không được để trống" })
    .max(100, { message: "Slug không được quá 100 ký tự" }),
  imageUrl: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  isFeatured: z.boolean().default(false),
  orderIndex: z.number().default(0),
  content: z.unknown().nullable().optional(),
  faq: z
    .array(
      z.object({
        question: z.string().min(1, { message: "Câu hỏi không được để trống" }),
        answer: z.string().min(1, { message: "Câu trả lời không được để trống" }),
      })
    )
    .nullable()
    .optional(),
  createdAt: z.iso.datetime({
    message: "Thời gian tạo không đúng định dạng ISO",
  }),
  updatedAt: z.iso.datetime({
    message: "Thời gian cập nhật không đúng định dạng ISO",
  }),
  deletedAt: z.iso
    .datetime({
      message: "Thời gian xóa không đúng định dạng ISO",
    })
    .nullable(),
});

export const createCategorySchema = categorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
});
