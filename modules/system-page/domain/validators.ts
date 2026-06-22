import { z } from "zod";

export const updateSystemPageSchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  metaTitle: z
    .string()
    .max(70, { message: "Tiêu đề SEO không nên quá 70 ký tự" })
    .nullable()
    .optional()
    .transform((val) => val || null),
  metaDescription: z
    .string()
    .max(160, { message: "Mô tả SEO không nên quá 160 ký tự" })
    .nullable()
    .optional()
    .transform((val) => val || null),
});

export type UpdateSystemPageInput = z.infer<typeof updateSystemPageSchema>;
