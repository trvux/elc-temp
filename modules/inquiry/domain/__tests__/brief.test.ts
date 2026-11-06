import { describe, expect, it } from "vitest";
import { briefPromptsForForm } from "../brief";

describe("briefPromptsForForm", () => {
  it("drops prompts that only ask for drawings or photos (the upload step asks them)", () => {
    expect(
      briefPromptsForForm([
        "Địa chỉ công trình",
        "Đã có bản vẽ mặt bằng chưa (gửi ảnh nếu có)",
        "Hãng và model máy",
        "Ảnh hoặc video lỗi nếu có",
        "Thời gian dự kiến thi công",
      ]),
    ).toEqual(["Địa chỉ công trình", "Hãng và model máy", "Thời gian dự kiến thi công"]);
  });

  it("keeps everything when nothing asks for a file", () => {
    expect(briefPromptsForForm(["Địa chỉ", "Số máy"])).toEqual(["Địa chỉ", "Số máy"]);
  });
});
