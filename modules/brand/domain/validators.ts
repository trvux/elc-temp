import { z } from "zod";

export const brandSchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  name: z
    .string()
    .min(1, { message: "Tên thương hiệu không được để trống" })
    .max(100, { message: "Tên thương hiệu không được quá 100 ký tự" }),
  slug: z
    .string()
    .min(1, { message: "Slug không được để trống" })
    .max(100, { message: "Slug không được quá 100 ký tự" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
    }),
  logoUrl: z
    .url({ message: "URL logo không hợp lệ" })
    .or(z.literal(""))
    .optional(),
  isFeatured: z.boolean().optional(),
  orderIndex: z.number().int().min(0, { message: "Thứ tự phải là số nguyên không âm" }).optional(),
  metaTitle: z.string().max(70, { message: "Tiêu đề SEO không nên quá 70 ký tự" }).nullable().optional(),
  metaDescription: z.string().max(160, { message: "Mô tả SEO không nên quá 160 ký tự" }).nullable().optional(),
  createdAt: z.string({
    message: "Thời gian tạo không hợp lệ",
  }),
  updatedAt: z.string({
    message: "Thời gian cập nhật không hợp lệ",
  }),
  deletedAt: z.string()
    .nullable(),
});

export const createBrandSchema = brandSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const updateBrandSchema = createBrandSchema.partial().extend({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
});
