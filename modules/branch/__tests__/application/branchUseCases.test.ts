import { describe, it, expect } from "vitest";
import { mockBranchRepo } from "../infrastructure/branchRepo.test";

describe("Branch Application Use Cases", () => {
  it("should fetch branches using repository", async () => {
    // This is a placeholder test for your application layer (e.g., UseCases / Services)
    const result = await mockBranchRepo.getAll();
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
