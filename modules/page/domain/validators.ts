import { z } from "zod";
import { Json } from "./types";

export const pageSchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  title: z
    .string()
    .min(1, { message: "Tiêu đề trang không được để trống" })
    .max(200, { message: "Tiêu đề trang không được quá 200 ký tự" }),
  slug: z
    .string()
    .min(1, { message: "Slug không được để trống" })
    .max(200, { message: "Slug không được quá 200 ký tự" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
    }),
  content: z.custom<Json>().default({}),
  isPublished: z.boolean().default(false),
  orderIndex: z.number().int().default(0),
  metaTitle: z.string().max(70, { message: "Tiêu đề SEO không nên quá 70 ký tự" }).nullable().optional(),
  metaDescription: z.string().max(160, { message: "Mô tả SEO không nên quá 160 ký tự" }).nullable().optional(),
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

export const createPageSchema = pageSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
