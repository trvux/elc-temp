import { describe, it, expect, vi, beforeEach } from "vitest";
import { createService, updateService, deleteService, getServices, getServiceBySlug } from "../../application";
import { serviceRepo } from "../../infrastructure";
import { Service, CreateServiceInput, UpdateServiceInput } from "../../domain/types";

// Mock the repository
vi.mock("../../infrastructure", () => ({
  serviceRepo: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Service Application Use Cases", () => {
  const mockServiceId = "550e8400-e29b-41d4-a716-446655440000";
  const mockService: Service = {
    id: mockServiceId,
    title: "Test Service",
    slug: "test-service",
    image: "",
    content: {},
    isPublished: true,
    orderIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getServices", () => {
    it("should call repository.getAll with options", async () => {
      vi.mocked(serviceRepo.getAll).mockResolvedValue([mockService]);
      const options = { isPublished: true };
      const result = await getServices(options);
      expect(serviceRepo.getAll).toHaveBeenCalledWith(options);
      expect(result).toEqual([mockService]);
    });
  });

  describe("getServiceBySlug", () => {
    it("should return service if found", async () => {
      vi.mocked(serviceRepo.getBySlug).mockResolvedValue(mockService);
      const result = await getServiceBySlug("test-service");
      expect(serviceRepo.getBySlug).toHaveBeenCalledWith("test-service");
      expect(result).toEqual(mockService);
    });

    it("should return null if not found", async () => {
      vi.mocked(serviceRepo.getBySlug).mockResolvedValue(null);
      const result = await getServiceBySlug("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("createService", () => {
    it("should validate input and call repository.create", async () => {
      const input: CreateServiceInput = {
        title: "New Service",
        slug: "new-service",
      };
      vi.mocked(serviceRepo.create).mockResolvedValue({ ...mockService, ...input });

      const result = await createService(input);

      expect(serviceRepo.create).toHaveBeenCalled();
      expect(result.title).toBe("New Service");
    });

    it("should throw error if validation fails", async () => {
      const input = { title: "" }; // Missing slug and invalid title
      await expect(createService(input as any)).rejects.toThrow();
    });
  });

  describe("updateService", () => {
    it("should validate input and call repository.update", async () => {
      const input: UpdateServiceInput = {
        id: mockServiceId,
        title: "Updated Title",
      };
      vi.mocked(serviceRepo.update).mockResolvedValue({ ...mockService, title: "Updated Title" });

      const result = await updateService(input);

      expect(serviceRepo.update).toHaveBeenCalled();
      expect(result.title).toBe("Updated Title");
    });
  });

  describe("deleteService", () => {
    it("should call repository.delete", async () => {
      vi.mocked(serviceRepo.delete).mockResolvedValue(undefined);
      await deleteService(mockServiceId);
      expect(serviceRepo.delete).toHaveBeenCalledWith(mockServiceId);
    });
  });
});
