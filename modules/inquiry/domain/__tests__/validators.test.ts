import { describe, expect, it } from "vitest";
import { createInquirySchema } from "../validators";

const base = { name: "Nguyễn Văn A", phone: "0901234567" };
const parse = (over: Record<string, unknown>) => createInquirySchema.safeParse({ ...base, ...over });

describe("createInquirySchema: name", () => {
  it("accepts a normal name and trims the edges", () => {
    const r = parse({ name: "  Nguyễn Văn A  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Nguyễn Văn A");
  });

  it.each(["", " ", "   ", "A", " A "])("rejects %j (staff cannot ask for that name)", (name) => {
    expect(parse({ name }).success).toBe(false);
  });
});

describe("createInquirySchema: phone", () => {
  it.each(["0901234567", "090 123 4567", "090.123.4567", "+84901234567", "84901234567"])("accepts %s", (phone) => {
    expect(parse({ phone }).success).toBe(true);
  });

  it.each(["", "123", "0201234567", "090123456", "abcdefghij"])("rejects %j", (phone) => {
    expect(parse({ phone }).success).toBe(false);
  });
});

describe("createInquirySchema: the rest stays optional", () => {
  it("needs only a name and a phone", () => {
    expect(createInquirySchema.safeParse(base).success).toBe(true);
  });

  it("rejects more than 6 attachments", () => {
    expect(parse({ attachments: ["a", "b", "c", "d", "e", "f", "g"] }).success).toBe(false);
  });
});
