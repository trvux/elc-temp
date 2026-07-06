import { z } from "zod";

export const createInquirySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Vui lòng nhập họ tên" })
    .max(255, { message: "Họ tên không được quá 255 ký tự" }),
  phone: z
    .string()
    .min(8, { message: "Số điện thoại không hợp lệ" })
    .max(30, { message: "Số điện thoại không được quá 30 ký tự" }),
  email: z
    .string()
    .email({ message: "Email không hợp lệ" })
    .optional()
    .or(z.literal("")),
  message: z.string().max(2000, { message: "Nội dung không được quá 2000 ký tự" }).optional(),
  productId: z.string().optional(),
  projectId: z.string().optional(),
  serviceId: z.string().optional(),
  // Honeypot — hidden from real visitors via CSS, must stay empty.
  website: z.string().optional().default(""),
});
