import { describe, it, expect } from "vitest";
import { createContactSchema, updateContactSchema } from "../../domain/validators";

describe("Contact Validators", () => {
  const validContact = {
    type: "phone",
    label: "Hotline",
    value: "0909123456",
    orderIndex: 1,
  };

  describe("createContactSchema", () => {
    it("should validate a valid contact", () => {
      const result = createContactSchema.safeParse(validContact);
      expect(result.success).toBe(true);
    });

    it("should fail if type is missing", () => {
      const { type, ...invalid } = validContact;
      const result = createContactSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should fail if value is missing", () => {
      const { value, ...invalid } = validContact;
      const result = createContactSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateContactSchema", () => {
    it("should validate a valid update", () => {
      const result = updateContactSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        value: "0909999999",
      });
      expect(result.success).toBe(true);
    });

    it("should fail if ID is not a UUID", () => {
      const result = updateContactSchema.safeParse({
        id: "invalid-id",
        value: "0909999999",
      });
      expect(result.success).toBe(false);
    });
  });
});
