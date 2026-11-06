import { describe, expect, it } from "vitest";
import type { BriefField } from "@/modules/service/domain/brief-fields";
import {
  briefFieldsForForm,
  briefPromptsForForm,
  buildBriefQualify,
  displayAnswer,
  isUnknown,
  UNKNOWN_ANSWER,
  unsettledFields,
} from "../brief";

const f = (key: string, label: string, kind: BriefField["kind"] = "text", extra: Partial<BriefField> = {}): BriefField => ({
  key,
  label,
  kind,
  ...extra,
});

describe("briefPromptsForForm", () => {
  it("drops prompts that only ask for drawings or photos (the upload step asks them)", () => {
    expect(
      briefPromptsForForm([
        "Số tầng",
        "Đã có bản vẽ mặt bằng chưa (gửi ảnh nếu có)",
        "Hãng và model máy",
        "Ảnh hoặc video lỗi nếu có",
        "Thời gian dự kiến thi công",
      ]),
    ).toEqual(["Số tầng", "Hãng và model máy", "Thời gian dự kiến thi công"]);
  });

  it("keeps everything that the form has no step for", () => {
    expect(briefPromptsForForm(["Hãng máy", "Số máy"])).toEqual(["Hãng máy", "Số máy"]);
  });
});

describe("briefFieldsForForm", () => {
  it("drops fields the upload step already asks for", () => {
    const fields = [f("a", "Số phòng", "number"), f("b", "Đã có bản vẽ mặt bằng chưa?", "yesno")];
    expect(briefFieldsForForm(fields).map((x) => x.key)).toEqual(["a"]);
  });

  it("drops fields the region step already asks for, so the address is asked once", () => {
    const fields = [f("a", "Địa chỉ công trình"), f("b", "Địa điểm sử dụng"), f("c", "Số máy", "number")];
    expect(briefFieldsForForm(fields).map((x) => x.key)).toEqual(["c"]);
  });
});

describe("unsettledFields", () => {
  const fields = [f("a", "A"), f("b", "B"), f("c", "C")];

  it("lists the fields with neither an answer nor 'Chưa biết'", () => {
    expect(unsettledFields(fields, { a: "x", b: UNKNOWN_ANSWER }).map((x) => x.key)).toEqual(["c"]);
  });

  it("treats whitespace as blank", () => {
    expect(unsettledFields(fields, { a: "  ", b: "x", c: "y" }).map((x) => x.key)).toEqual(["a"]);
  });

  it("is empty once every field is answered or marked unknown", () => {
    expect(unsettledFields(fields, { a: "1", b: UNKNOWN_ANSWER, c: UNKNOWN_ANSWER })).toEqual([]);
  });
});

describe("displayAnswer", () => {
  it("reads an unknown as 'chưa biết', an area band by its label and a number with its unit", () => {
    expect(displayAnswer(f("a", "A"), UNKNOWN_ANSWER)).toBe("chưa biết");
    expect(displayAnswer(f("a", "Diện tích", "area"), "100-150")).toBe("100 - 150 m²");
    expect(displayAnswer(f("n", "Số phòng", "number", { unit: "phòng" }), "4")).toBe("4 phòng");
    expect(displayAnswer(f("n", "Số tầng", "number"), "3")).toBe("3");
  });

  it("recognises the unknown marker", () => {
    expect(isUnknown(UNKNOWN_ANSWER)).toBe(true);
    expect(isUnknown("chưa biết")).toBe(false);
  });
});

describe("buildBriefQualify", () => {
  const fields = [
    f("dien_tich", "Diện tích cần làm lạnh", "area"),
    f("so_phong", "Số phòng", "number", { unit: "phòng" }),
    f("loai", "Loại công trình", "choice", { options: ["Nhà phố", "Biệt thự"] }),
  ];

  it("adds nothing when no field was settled", () => {
    expect(buildBriefQualify("thi-cong", fields, {})).toEqual({});
  });

  it("lists every settled field, counts only real answers and keeps 'chưa biết' visible", () => {
    const q = buildBriefQualify("dich-vu", fields, { dien_tich: UNKNOWN_ANSWER, so_phong: "4", loai: "Nhà phố" });
    expect(q.brief).toBe("Diện tích cần làm lạnh: chưa biết\nSố phòng: 4 phòng\nLoại công trình: Nhà phố");
    expect(q.briefAnswered).toBe("2");
    expect(q.briefTotal).toBe("3");
    expect(q.briefUnknown).toBe("1");
  });

  it("does not report briefUnknown when nothing was unknown", () => {
    const q = buildBriefQualify("dich-vu", fields, { dien_tich: "50-100", so_phong: "2", loai: "Biệt thự" });
    expect(q.briefUnknown).toBeUndefined();
    expect(q.briefAnswered).toBe(q.briefTotal);
  });

  it("gives a system installation its size band from the area field, raw and mapped", () => {
    const q = buildBriefQualify("thi-cong", fields, { dien_tich: ">1000", so_phong: "20", loai: "Nhà phố" });
    expect(q.areaBand).toBe(">1000");
    expect(q.scale).toBe(">1000m2");
  });

  it("gives no size band when the area is unknown, or for a service line", () => {
    expect(buildBriefQualify("thi-cong", fields, { dien_tich: UNKNOWN_ANSWER, so_phong: "1", loai: "x" }).scale).toBeUndefined();
    expect(buildBriefQualify("dich-vu", fields, { dien_tich: ">1000", so_phong: "1", loai: "x" }).scale).toBeUndefined();
  });

  it("still reads the area from a free-text field of a service nobody has typed yet", () => {
    const legacy = [f("dien_tich_can_dieu_hoa", "Diện tích cần điều hòa")];
    expect(buildBriefQualify("thi-cong", legacy, { dien_tich_can_dieu_hoa: "khoảng 1.200 m2" }).scale).toBe(">1000m2");
  });
});
