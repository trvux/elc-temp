import { z } from "zod";

export const serviceTypeSchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  name: z
    .string()
    .min(1, { message: "Tên loại hình dịch vụ không được để trống" })
    .max(100, { message: "Tên loại hình dịch vụ không được quá 100 ký tự" }),
  slug: z
    .string()
    .min(1, { message: "Slug không được để trống" })
    .regex(/^[a-z0-9-]+$/, { message: "Slug chỉ được chứa chữ cái thường, số và dấu gạch ngang" }),
  image: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  isFeatured: z.boolean().default(false),
  orderIndex: z.coerce.number().default(0),
  categoryIds: z.array(z.uuid({ message: "ID danh mục không đúng định dạng UUID" })).optional(),
  createdAt: z.string().datetime({
    message: "Thời gian tạo không đúng định dạng ISO",
  }),
  updatedAt: z.string().datetime({
    message: "Thời gian cập nhật không đúng định dạng ISO",
  }),
  deletedAt: z
    .string()
    .datetime({
      message: "Thời gian xóa không đúng định dạng ISO",
    })
    .nullable(),
});

export const createServiceTypeSchema = serviceTypeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const updateServiceTypeSchema = createServiceTypeSchema.partial().extend({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
});
