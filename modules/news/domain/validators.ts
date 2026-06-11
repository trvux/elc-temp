import {z} from "zod";
import { Json } from "./types";

export const newsSchema = z.object({
    id: z.uuid({message: "ID không đúng định dạng UUID"}),
    title: z
        .string()
        .min(1, {message: "Tiêu đề tin tức không được để trống"})
        .max(200, {message: "Tiêu đề tin tức không được quá 200 ký tự"}),
    slug: z
        .string()
        .min(1, {message: "Slug không được để trống"})
        .max(200, {message: "Slug không được quá 200 ký tự"})
        .regex(/^[a-z0-9-]+$/, {
            message: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
        }),
    image: z.url({message: "URL ảnh không hợp lệ"}).or(z.literal("")).default(""),
    content: z.custom<Json>().default({}),
    categoryId: z.string().nullable().optional().or(z.literal("")),
    isPublished: z.boolean().default(false),
    metaTitle: z.string().max(70, { message: "Tiêu đề SEO không nên quá 70 ký tự" }).nullable().optional(),
    metaDescription: z.string().max(160, { message: "Mô tả SEO không nên quá 160 ký tự" }).nullable().optional(),
    orderIndex: z.number().int().default(0),
    createdAt: z.iso.datetime({
        message: "Thời gian tạo không đúng định dạng ISO",
    }),
    updatedAt: z.iso.datetime({
        message: "Thời gian cập nhật không đúng định dạng ISO",
    }),
    deletedAt: z.iso
        .datetime({message: "Thời gian xóa không đúng định dạng ISO"})
        .nullable(),
});

export const createNewsSchema = newsSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
});

export const updateNewsSchema = createNewsSchema.partial().extend({
    id: z.uuid({message: "ID không đúng định dạng UUID"}),
});
