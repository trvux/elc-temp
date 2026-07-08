import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().optional(),
  serviceId: z.string().optional(),
  rating: z
    .number()
    .int()
    .min(1, { message: "Vui lòng chọn số sao đánh giá" })
    .max(5, { message: "Số sao đánh giá không hợp lệ" }),
  comment: z
    .string()
    .min(1, { message: "Vui lòng nhập nội dung đánh giá" })
    .max(2000, { message: "Nội dung không được quá 2000 ký tự" }),
  reviewerName: z
    .string()
    .min(1, { message: "Vui lòng nhập họ tên" })
    .max(100, { message: "Họ tên không được quá 100 ký tự" }),
  reviewerPhone: z.string().max(30).optional().or(z.literal("")),
  // Honeypot — hidden from real visitors via CSS, must stay empty.
  website: z.string().optional().default(""),
});
