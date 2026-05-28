import {z} from "zod";

export const branchSchema = z.object({
    id: z.uuid({message: "ID không đúng định dạng UUID"}),
    name: z
        .string()
        .min(1, {message: "Tên chi nhánh không được để trống"})
        .max(100, {message: "Tên chi nhánh không được quá 100 ký tự"}),
    slug: z
        .string()
        .min(1, {message: "Slug không được để trống"})
        .max(100, {message: "Slug không được quá 100 ký tự"})
        .regex(/^[a-z0-9-]+$/, {
            message: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
        }),
    address: z.string().min(1, {message: "Địa chỉ không được để trống"}),
    phone: z.string().min(1, {message: "Số điện thoại không được để trống"}),
    email: z.email({message: "Email không hợp lệ"}),
    mapsUrl: z.url({message: "URL bản đồ không hợp lệ"}),
    mapsEmbed: z.string().min(1, {message: "Mã nhúng bản đồ không được để trống"}),
    description: z.unknown(),
    imageUrl: z.string().nullable().optional(),
    isPublished: z.boolean(),
    orderIndex: z.number().int(),
    metaTitle: z.string().max(70, { message: "Tiêu đề SEO không nên quá 70 ký tự" }).nullable().optional(),
    metaDescription: z.string().max(160, { message: "Mô tả SEO không nên quá 160 ký tự" }).nullable().optional(),
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

export const createBranchSchema = branchSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
});

export const updateBranchSchema = createBranchSchema.partial().extend({
    id: z.uuid({message: "ID không đúng định dạng UUID"}),
});
