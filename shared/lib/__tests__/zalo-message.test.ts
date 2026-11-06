import { describe, expect, it } from "vitest";
import { buildZaloServiceMessage } from "@/shared/lib/zalo-message";

const base = {
  serviceName: "Điều hòa trung tâm VRV cho biệt thự và nhà ở",
  serviceSlug: "dieu-hoa-trung-tam-vrv-cho-biet-thu-nha-o",
  opener: "Chào ELC, tôi muốn nhận khảo sát và báo giá:",
};

describe("buildZaloServiceMessage", () => {
  it("names the service and links its own page", () => {
    const msg = buildZaloServiceMessage(base);
    expect(msg).toBe(
      [
        "Chào ELC, tôi muốn nhận khảo sát và báo giá:",
        "Điều hòa trung tâm VRV cho biệt thự và nhà ở",
        "Link: https://dienmayelc.com.vn/dich-vu/dieu-hoa-trung-tam-vrv-cho-biet-thu-nha-o",
      ].join("\n"),
    );
  });

  it("never mentions a price", () => {
    expect(buildZaloServiceMessage({ ...base, briefPrompts: ["Địa chỉ"] })).not.toMatch(/giá ưu đãi|Liên hệ để/i);
  });

  it("appends one blank per prompt for the customer to fill in", () => {
    const msg = buildZaloServiceMessage({ ...base, briefPrompts: ["Địa chỉ công trình", "Số tầng và tổng diện tích sàn"] });
    expect(msg.endsWith("\n\n- Địa chỉ công trình:\n- Số tầng và tổng diện tích sàn:")).toBe(true);
  });

  it("does not double the colon or question mark", () => {
    const msg = buildZaloServiceMessage({ ...base, briefPrompts: ["Đã có bản vẽ chưa?", "Địa chỉ:"] });
    expect(msg).toContain("- Đã có bản vẽ chưa?\n- Địa chỉ:");
    expect(msg).not.toContain("?:");
    expect(msg).not.toContain("::");
  });

  it("ignores blank prompts and adds no empty block when there are none", () => {
    expect(buildZaloServiceMessage({ ...base, briefPrompts: ["", "   "] })).toBe(buildZaloServiceMessage(base));
    expect(buildZaloServiceMessage({ ...base, briefPrompts: [] })).not.toContain("\n\n");
  });

  it("fills in the answers already given and leaves the rest blank", () => {
    const msg = buildZaloServiceMessage({
      ...base,
      briefPrompts: ["Địa chỉ công trình", "Số tầng và tổng diện tích sàn", "Đã có bản vẽ chưa?"],
      answers: { "Địa chỉ công trình": " 12 Nguyễn Huệ, Quận 1 ", "Đã có bản vẽ chưa?": "Chưa" },
    });
    expect(msg).toContain("- Địa chỉ công trình: 12 Nguyễn Huệ, Quận 1");
    expect(msg).toContain("- Số tầng và tổng diện tích sàn:\n");
    expect(msg.endsWith("- Đã có bản vẽ chưa? Chưa")).toBe(true);
  });

  it("ignores an answer for a prompt that is not in the list", () => {
    const msg = buildZaloServiceMessage({ ...base, briefPrompts: ["Địa chỉ"], answers: { "Khác": "x" } });
    expect(msg).not.toContain("x");
    expect(msg.endsWith("- Địa chỉ:")).toBe(true);
  });
});
