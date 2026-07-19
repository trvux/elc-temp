import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z
    .number()
    .min(1, { message: "Vui lòng chọn số sao" })
    .max(5, { message: "Số sao không hợp lệ" }),
  reviewerName: z
    .string()
    .min(1, { message: "Vui lòng nhập họ tên" })
    .max(100, { message: "Họ tên không được quá 100 ký tự" }),
  reviewerPhone: z
    .string()
    .min(8, { message: "Số điện thoại không hợp lệ" })
    .max(30, { message: "Số điện thoại không được quá 30 ký tự" }),
  comment: z
    .string()
    .min(1, { message: "Vui lòng nhập nội dung đánh giá" })
    .max(2000, { message: "Nội dung không được quá 2000 ký tự" }),
  // Honeypot — hidden from real visitors via CSS, must stay empty.
  website: z.string().optional().default(""),
});
