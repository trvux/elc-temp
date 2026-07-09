import { z } from "zod";

export const attributeDefinitionSchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  categoryId: z.uuid({ message: "ID danh mục không đúng định dạng UUID" }).nullable().optional(),
  code: z
    .string()
    .min(1, { message: "Mã thuộc tính không được để trống" })
    .max(50, { message: "Mã thuộc tính không được quá 50 ký tự" })
    .regex(/^[a-z0-9_]+$/, { message: "Mã thuộc tính chỉ được chứa chữ thường, số và dấu gạch dưới" }),
  name: z
    .string()
    .min(1, { message: "Tên thuộc tính không được để trống" })
    .max(150, { message: "Tên thuộc tính không được quá 150 ký tự" }),
  groupLabel: z.string().nullable().optional(),
  dataType: z.enum(["number", "text", "boolean", "select"]),
  unit: z.string().nullable().optional(),
  options: z.array(z.string().min(1)).default([]),
  orderIndex: z.coerce.number().int().min(0).default(0),
  isRequired: z.boolean().default(false),
  createdAt: z.iso.datetime({ message: "Thời gian tạo không đúng định dạng ISO" }),
  updatedAt: z.iso.datetime({ message: "Thời gian cập nhật không đúng định dạng ISO" }),
  deletedAt: z.iso.datetime({ message: "Thời gian xóa không đúng định dạng ISO" }).nullable(),
});

export const createAttributeDefinitionSchema = attributeDefinitionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

// categoryId/code/dataType are not sendable on update — see
// UpdateAttributeDefinitionInput's doc comment.
export const updateAttributeDefinitionSchema = createAttributeDefinitionSchema
  .omit({ categoryId: true, code: true, dataType: true })
  .partial()
  .extend({
    id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  });
