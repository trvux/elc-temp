import { z } from "zod";

const categorySchema = z.object({
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
  isHidden: z.boolean().default(false),
  orderIndex: z.number().default(0),
  content: z.unknown().nullable().optional(),
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
