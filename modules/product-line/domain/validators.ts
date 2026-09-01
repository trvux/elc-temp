import { z } from "zod";

const productLineSchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  brandId: z.uuid({ message: "ID thương hiệu không đúng định dạng UUID" }),
  categoryId: z.uuid({ message: "ID danh mục không đúng định dạng UUID" }).nullable().optional(),
  code: z
    .string()
    .min(1, { message: "Mã dòng sản phẩm không được để trống" })
    .max(50, { message: "Mã dòng sản phẩm không được quá 50 ký tự" }),
  name: z
    .string()
    .min(1, { message: "Tên dòng sản phẩm không được để trống" })
    .max(150, { message: "Tên dòng sản phẩm không được quá 150 ký tự" }),
  tierRank: z.coerce.number().int().min(0).default(0),
  description: z.string().nullable().optional(),
  mpnPrefixes: z.array(z.string().min(1)).default([]),
  createdAt: z.iso.datetime({ message: "Thời gian tạo không đúng định dạng ISO" }),
  updatedAt: z.iso.datetime({ message: "Thời gian cập nhật không đúng định dạng ISO" }),
  deletedAt: z.iso.datetime({ message: "Thời gian xóa không đúng định dạng ISO" }).nullable(),
});

export const createProductLineSchema = productLineSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});