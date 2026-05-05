import { z } from "zod";
import { Json } from "./types";
import { STOCK_STATUS } from "./constants";

// --- Product Validators ---

export const productSchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  name: z
    .string()
    .min(1, { message: "Tên sản phẩm không được để trống" })
    .max(200, { message: "Tên sản phẩm không được quá 200 ký tự" }),
  slug: z
    .string()
    .min(1, { message: "Slug không được để trống" })
    .max(200, { message: "Slug không được quá 200 ký tự" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
    }),
  sku: z.string().min(1, { message: "SKU không được để trống" }),
  shortDescription: z.string().default(""),
  description: z.custom<Json>().default({}),
  specs: z.custom<Json>().default({}),
  originalPrice: z.coerce.number().min(0, { message: "Giá gốc không được nhỏ hơn 0" }),
  salePrice: z.coerce.number().min(0, { message: "Giá bán không được nhỏ hơn 0" }).default(0),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  images: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  orderIndex: z.coerce.number().int().default(0),
  categoryId: z.uuid({ message: "ID danh mục không đúng định dạng UUID" }),
  brandId: z.uuid({ message: "ID thương hiệu không đúng định dạng UUID" }),
  stockStatus: z
    .nativeEnum(STOCK_STATUS)
    .default(STOCK_STATUS.IN_STOCK),
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

export const createProductSchema = productSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .extend({
    description: z.custom<Json>().default({}),
    specs: z.custom<Json>().default({}),
  });

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
});
