import { z } from "zod";
import { CATEGORY_TYPES } from "./constants";

import { type CategoryType } from "./types";

// Chuyển keys của CATEGORY_TYPES thành array để dùng cho z.enum
const categoryTypeKeys = Object.keys(CATEGORY_TYPES) as [
  CategoryType,
  ...CategoryType[],
];

export const categorySchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  name: z
    .string()
    .min(1, { message: "Tên danh mục không được để trống" })
    .max(100, { message: "Tên danh mục không được quá 100 ký tự" }),
  slug: z
    .string()
    .min(1, { message: "Slug không được để trống" })
    .max(100, { message: "Slug không được quá 100 ký tự" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
    }),
  parentId: z.uuid({ message: "ID cha không đúng định dạng UUID" }).nullable(),
  type: z.enum(categoryTypeKeys, {
    message: "Loại danh mục không hợp lệ",
  }),
  metaTitle: z.string().max(70, { message: "Tiêu đề SEO không nên quá 70 ký tự" }).nullable().optional(),
  metaDescription: z.string().max(160, { message: "Mô tả SEO không nên quá 160 ký tự" }).nullable().optional(),
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
  isDeleted: z.boolean().optional(), // Helper for soft delete updates if needed
});
