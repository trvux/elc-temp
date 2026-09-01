import { z } from "zod";

const authorSchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  name: z
    .string()
    .min(1, { message: "Tên tác giả không được để trống" })
    .max(100, { message: "Tên tác giả không được quá 100 ký tự" }),
  slug: z
    .string()
    .min(1, { message: "Slug không được để trống" })
    .max(100, { message: "Slug không được quá 100 ký tự" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
    }),
  avatarUrl: z.url({ message: "URL ảnh đại diện không hợp lệ" }).or(z.literal("")).optional(),
  bio: z.string().max(500, { message: "Tiểu sử không nên quá 500 ký tự" }).optional(),
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

export const createAuthorSchema = authorSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
