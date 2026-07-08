import { z } from "zod";
import { Json } from "./types";

const imageAssetSchema = z.object({
  url: z.string().url({ message: "Đường dẫn ảnh không hợp lệ" }),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

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
  images: z.array(imageAssetSchema).default([]),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  metaTitle: z.string().max(70, { message: "Tiêu đề SEO không nên quá 70 ký tự" }).nullable().optional(),
  metaDescription: z.string().max(160, { message: "Mô tả SEO không nên quá 160 ký tự" }).nullable().optional(),
  seo: z
    .object({
      title: z.string().max(70, { message: "Tiêu đề SEO không nên quá 70 ký tự" }).nullable().optional(),
      description: z.string().max(160, { message: "Mô tả SEO không nên quá 160 ký tự" }).nullable().optional(),
      noindex: z.boolean().optional(),
    })
    .optional(),
  orderIndex: z.number().int().default(0),
  projectTypeId: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().uuid({ message: "ID loại hình công trình không đúng định dạng UUID" }).nullable().optional()
  ),
  serviceIds: z.array(z.string().uuid({ message: "ID dịch vụ không đúng định dạng UUID" })).optional(),
  categories: z
    .array(
      z.object({
        id: z.uuid({ message: "ID danh mục không đúng định dạng UUID" }),
        condition: z.enum(["new", "used"]),
      })
    )
    .optional(),
  tagIds: z.array(z.string()).optional(),
  clientName: z.string().max(150, { message: "Tên khách hàng không nên quá 150 ký tự" }).optional(),
  location: z.string().max(200, { message: "Địa điểm không nên quá 200 ký tự" }).optional(),
  completedAt: z.string().nullable().optional(),
  testimonialQuote: z.string().max(500, { message: "Nhận xét không nên quá 500 ký tự" }).optional(),
  testimonialAuthor: z.string().max(150, { message: "Tên người nhận xét không nên quá 150 ký tự" }).optional(),
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
