import { z } from "zod";

// Vietnamese mobile numbers: 10 digits starting 0, or the +84/84 form
// without the leading 0 — second digit must be 3/5/7/8/9. Deliberately not
// a strict E.164 check: that would reject a normally-typed local number
// ("09xx xxx xxx"), which is worse than under-validating.
const VN_MOBILE_REGEX = /^(0|84|\+84)[35789]\d{8}$/;

export const createInquirySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Vui lòng nhập họ tên" })
    .max(255, { message: "Họ tên không được quá 255 ký tự" }),
  phone: z
    .string()
    .min(8, { message: "Số điện thoại không hợp lệ" })
    .max(30, { message: "Số điện thoại không được quá 30 ký tự" })
    .refine((v) => VN_MOBILE_REGEX.test(v.replace(/[\s.-]/g, "")), {
      message: "Số điện thoại không hợp lệ (đầu số 03/05/07/08/09)",
    }),
  email: z
    .string()
    .email({ message: "Email không hợp lệ" })
    .optional()
    .or(z.literal("")),
  message: z.string().max(2000, { message: "Nội dung không được quá 2000 ký tự" }).optional(),
  productId: z.string().optional(),
  projectId: z.string().optional(),
  serviceId: z.string().optional(),
  leadType: z.enum(["product", "service", "project", "general"]).optional(),
  subType: z.string().optional(),
  qualifyData: z.record(z.string(), z.string()).optional(),
  attachments: z
    .array(z.string().min(1))
    .max(6, { message: "Tối đa 6 ảnh" })
    .optional(),
  // Honeypot — hidden from real visitors via CSS, must stay empty.
  website: z.string().optional().default(""),
});
