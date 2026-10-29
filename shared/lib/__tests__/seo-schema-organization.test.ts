import { describe, expect, it } from "vitest";
import { ORGANIZATION_DESCRIPTION, SEOSchema } from "@/shared/lib/seo-schema";

describe("SEOSchema.getOrganization", () => {
  it("includes a non-trivial description", () => {
    const org = SEOSchema.getOrganization([], []);
    expect(org.description).toBe(ORGANIZATION_DESCRIPTION);
    expect(org.description.length).toBeGreaterThan(50);
  });
});
