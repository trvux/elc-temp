import { z } from "zod";

export const groupSchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  name: z
    .string()
    .min(1, { message: "Tên nhóm không được để trống" })
    .max(100, { message: "Tên nhóm không được quá 100 ký tự" }),
  slug: z
    .string()
    .min(1, { message: "Slug không được để trống" })
    .max(100, { message: "Slug không được quá 100 ký tự" }),
  imageUrl: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  isFeatured: z.boolean().default(false),
  orderIndex: z.number().default(0),
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

export const createGroupSchema = groupSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const updateGroupSchema = createGroupSchema.partial().extend({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
});
