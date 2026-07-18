import { z } from "zod";
import { Json } from "./types";
import { VARIANT_STOCK_STATUS } from "./constants";

const imageAssetSchema = z.object({
  url: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

// --- v2: options/variants (see elc-go/docs/product-v2-design.md) ---

export const productOptionInputSchema = z.object({
  name: z.string().min(1, { message: "Tên option không được để trống" }),
  values: z.array(z.string().min(1)).min(1, { message: "Cần ít nhất 1 giá trị" }),
});

const variantOptionSelectionSchema = z.object({
  optionName: z.string().min(1),
  value: z.string().min(1),
});

const variantComponentInputSchema = z.object({
  componentIndex: z.coerce.number().int().min(0),
  quantity: z.coerce.number().int().min(1).default(1),
  role: z.string().nullable().optional(),
});

export const attributeValueInputSchema = z.object({
  attributeDefinitionId: z.string().min(1),
  valueText: z.string().nullable().optional(),
  valueNumber: z.coerce.number().nullable().optional(),
  valueBoolean: z.boolean().nullable().optional(),
  // Only meaningful for dataType = "multiselect".
  valueOptions: z.array(z.string()).nullable().optional(),
});

export const productVariantInputSchema = z.object({
  mpn: z.string().min(1, { message: "MPN không được để trống" }),
  sku: z.string().optional(),
  gtin: z.string().nullable().optional(),
  isDefault: z.boolean().default(false),
  isComponentOnly: z.boolean().default(false),
  stockStatus: z.nativeEnum(VARIANT_STOCK_STATUS).default(VARIANT_STOCK_STATUS.IN_STOCK),
  leadTimeDays: z.coerce.number().int().nullable().optional(),
  originalPrice: z.coerce.number().min(0, { message: "Giá gốc không được nhỏ hơn 0" }),
  salePrice: z.coerce.number().min(0).nullable().optional(),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  weight: z.coerce.number().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
  orderIndex: z.coerce.number().int().default(0),
  optionSelections: z.array(variantOptionSelectionSchema).default([]),
  components: z.array(variantComponentInputSchema).default([]),
});

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
  description: z.custom<Json>().default({}),
  shortDescription: z.string().max(500, { message: "Mô tả ngắn không nên quá 500 ký tự" }).nullable().optional(),
  images: z.array(imageAssetSchema).default([]),
  isFeatured: z.boolean().default(false),
  orderIndex: z.coerce.number().int().default(0),
  categoryId: z.uuid({ message: "ID danh mục không đúng định dạng UUID" }),
  brandId: z.uuid({ message: "ID thương hiệu không đúng định dạng UUID" }),
  tagIds: z.array(z.string()).optional(),
  productLineId: z.uuid().nullable().optional(),
  options: z.array(productOptionInputSchema).optional(),
  // At least one variant is required — Product itself carries no sku/mpn/
  // price, see elc-go's domain.Product doc comment.
  variants: z.array(productVariantInputSchema).min(1, { message: "Cần ít nhất 1 biến thể" }),
  attributeValues: z.array(attributeValueInputSchema).optional(),
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

export const createProductSchema = productSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .extend({
    description: z.custom<Json>().default({}),
  });

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
});
