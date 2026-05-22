import { z } from "zod";
import { Json } from "./types";

export const projectSchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  title: z
    .string()
    .min(1, { message: "Tiêu đề dự án không được để trống" })
    .max(200, { message: "Tiêu đề dự án không được quá 200 ký tự" }),
  slug: z
    .string()
    .min(1, { message: "Slug không được để trống" })
    .max(200, { message: "Slug không được quá 200 ký tự" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
    }),
  description: z.custom<Json>().default({}),
  images: z
    .array(z.string().url({ message: "Đường dẫn ảnh không hợp lệ" }))
    .default([]),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  metaTitle: z.string().max(70, { message: "Tiêu đề SEO không nên quá 70 ký tự" }).nullable().optional(),
  metaDescription: z.string().max(160, { message: "Mô tả SEO không nên quá 160 ký tự" }).nullable().optional(),
  orderIndex: z.number().int().default(0),
  categoryId: z.uuid({ message: "ID danh mục không đúng định dạng UUID" }),
  serviceTypeId: z.uuid({ message: "ID loại hình dịch vụ không đúng định dạng UUID" }).nullable().optional(),
  categoryIds: z.array(z.uuid({ message: "ID danh mục không đúng định dạng UUID" })).optional(),
  createdAt: z.iso.datetime({
    message: "Thời gian tạo không đúng định dạng ISO",
  }),
  updatedAt: z.iso.datetime({
    message: "Thời gian cập nhật không đúng định dạng ISO",
  }),
  deletedAt: z.iso
    .datetime({ message: "Thời gian xóa không đúng định dạng ISO" })
    .nullable(),
});

export const createProjectSchema = projectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
});
