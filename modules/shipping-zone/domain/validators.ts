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

export const createShippingZoneSchema = z.object(baseShippingZoneFields).refine(dayRangeRefine, dayRangeIssue);
