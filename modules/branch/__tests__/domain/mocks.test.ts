import { describe, it, expect } from "vitest";
import { mockBranches } from "../../domain/mocks";

describe("Branch Domain Mocks", () => {
  it("should have valid mock branches", () => {
    expect(mockBranches.length).toBeGreaterThan(0);
    expect(mockBranches[0].name).toBe("Văn phòng");
  });
});
