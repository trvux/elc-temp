import { z } from "zod";
import { CONTACT_TYPES, SETTINGS_KEYS } from "./constants";

const contactTypeValues = Object.values(CONTACT_TYPES) as [string, ...string[]];
const settingsKeyValues = Object.values(SETTINGS_KEYS) as [string, ...string[]];

const siteSettingSchema = z.object({
  key: z.enum(settingsKeyValues).or(z.string()),
  value: z.string().default(""),
});

const contactSchema = z.object({
  id: z.uuid({ message: "ID không đúng định dạng UUID" }),
  type: z.enum(contactTypeValues).or(z.string()),
  label: z.string().min(1, { message: "Nhãn không được để trống" }),
  value: z.string().min(1, { message: "Giá trị không được để trống" }),
  orderIndex: z.number().int().default(0),
});
