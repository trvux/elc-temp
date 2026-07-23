import { z } from "zod";

export const hpPageSchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  name: z
    .string()
    .min(1, { message: "Tên trang không được để trống" })
    .max(100, { message: "Tên trang không được quá 100 ký tự" }),
  slug: z
    .string()
    .min(1, { message: "Slug không được để trống" })
    .max(100, { message: "Slug không được quá 100 ký tự" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
    }),
  imageUrl: z
    .url({ message: "URL ảnh không hợp lệ" })
    .or(z.literal(""))
    .optional(),
  orderIndex: z.number().int().min(0, { message: "Thứ tự phải là số nguyên không âm" }).optional(),
  metaTitle: z.string().max(70, { message: "Tiêu đề SEO không nên quá 70 ký tự" }).nullable().optional(),
  metaDescription: z.string().max(160, { message: "Mô tả SEO không nên quá 160 ký tự" }).nullable().optional(),
  content: z.unknown().nullable().optional(),
  attributeCode: z.string().min(1, { message: "Chọn thuộc tính để lọc sản phẩm" }),
  attributeValues: z.array(z.string()).min(1, { message: "Chọn ít nhất 1 giá trị" }),
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

export const createHpPageSchema = hpPageSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const updateHpPageSchema = createHpPageSchema.partial().extend({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
});
