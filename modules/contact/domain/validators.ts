import { z } from "zod";

export const contactSchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  type: z.string().min(1, { message: "Loại liên hệ không được để trống" }),
  label: z.string().max(100).nullable().default(""),
  value: z.string().min(1, { message: "Giá trị liên hệ không được để trống" }),
  orderIndex: z.number().int().default(0),
});

export const createContactSchema = contactSchema.omit({
  id: true,
});

export const updateContactSchema = createContactSchema.partial().extend({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
});
