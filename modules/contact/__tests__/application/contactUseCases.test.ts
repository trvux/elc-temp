import { describe, it, expect, vi, beforeEach } from "vitest";
import { createContact } from "../../application/createContact";
import { contactRepo } from "../../infrastructure";

vi.mock("../../infrastructure", () => ({
  contactRepo: {
    create: vi.fn(),
  },
}));

describe("Contact Use Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createContact", () => {
    it("should call repository with validated data", async () => {
      const input = {
        type: "phone",
        value: "0123456789",
        label: "CSKH",
      };

      const mockResult = { id: "1", ...input, orderIndex: 0 };
      vi.mocked(contactRepo.create).mockResolvedValue(mockResult);

      const result = await createContact(input);

      expect(contactRepo.create).toHaveBeenCalledWith(expect.objectContaining(input));
      expect(result).toEqual(mockResult);
    });

    it("should throw error if validation fails", async () => {
      const input = { type: "" }; // Invalid
      await expect(createContact(input as any)).rejects.toThrow();
    });
  });
});
