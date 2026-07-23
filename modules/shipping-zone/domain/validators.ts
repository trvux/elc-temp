import { z } from "zod";

const baseShippingZoneFields = {
  name: z
    .string()
    .min(1, { message: "Tên khu vực không được để trống" })
    .max(150, { message: "Tên khu vực không được quá 150 ký tự" }),
  feeVnd: z.number().int().min(0, { message: "Phí giao không được âm" }),
  minDays: z.number().int().min(0, { message: "Số ngày tối thiểu không được âm" }),
  maxDays: z.number().int().min(0, { message: "Số ngày tối đa không được âm" }),
  isDefault: z.boolean().optional(),
  provinceCodes: z.array(z.string()),
  wardCodes: z.array(z.string()),
};

function dayRangeRefine<T extends { minDays: number; maxDays: number }>(data: T) {
  return data.maxDays >= data.minDays;
}
const dayRangeIssue = {
  message: "Số ngày tối đa phải lớn hơn hoặc bằng số ngày tối thiểu",
  path: ["maxDays"] as (string | number)[],
};

export const shippingZoneSchema = z
  .object({
    id: z.uuid({ message: "ID không đúng định dạng UUID" }),
    ...baseShippingZoneFields,
    createdAt: z.iso.datetime({ message: "Thời gian tạo không đúng định dạng ISO" }),
    updatedAt: z.iso.datetime({ message: "Thời gian cập nhật không đúng định dạng ISO" }),
    deletedAt: z.iso.datetime({ message: "Thời gian xóa không đúng định dạng ISO" }).nullable(),
  })
  .refine(dayRangeRefine, dayRangeIssue);

export const createShippingZoneSchema = z.object(baseShippingZoneFields).refine(dayRangeRefine, dayRangeIssue);

export const updateShippingZoneSchema = z
  .object({ ...baseShippingZoneFields, id: z.uuid({ message: "ID không đúng định dạng UUID" }) })
  .partial()
  .extend({ id: z.uuid({ message: "ID không đúng định dạng UUID" }) });
