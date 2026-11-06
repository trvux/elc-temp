import type { BriefField } from "@/modules/service/domain/brief-fields";
import { areaBand, areaBandOption, parseAreaM2 } from "./area";

// A service's brief is a list of typed fields (what staff need to quote). It is shown in
// two places: the Zalo message and the lead form. The form already has steps for the
// things some fields ask, so those fields would ask the same thing twice there:
//   - the upload step takes drawings and photos ("Đã có bản vẽ mặt bằng chưa?",
//     "Ảnh hoặc video lỗi nếu có");
//   - the region step takes where the work is ("Địa chỉ công trình", "Địa điểm sử dụng").
// The Zalo message and the service page keep them all: Zalo has no such steps.
const ASKED_BY_OTHER_STEPS = /bản vẽ|ảnh|video|địa chỉ|địa điểm/i;

export function briefFieldsForForm(fields: BriefField[]): BriefField[] {
  return fields.filter((field) => !ASKED_BY_OTHER_STEPS.test(field.label));
}

/** Kept for callers that only have labels (the Zalo message side). */
export function briefPromptsForForm(prompts: string[]): string[] {
  return prompts.filter((prompt) => !ASKED_BY_OTHER_STEPS.test(prompt));
}

/**
 * What is stored when the visitor marks a field "Chưa biết". Distinct from a blank
 * (never answered) so staff can tell "does not know" from "skipped", and so the
 * priority badge counts only answers that give them something to quote from.
 */
export const UNKNOWN_ANSWER = "(chưa biết)";

export const YES_NO_OPTIONS = ["Có", "Không"] as const;

export function isUnknown(value: string | undefined): boolean {
  return value === UNKNOWN_ANSWER;
}

/** Answered for the purpose of leaving the step: a real answer or an explicit "Chưa biết". */
export function isSettled(value: string | undefined): boolean {
  return (value ?? "").trim() !== "";
}

/** The fields still blank, in order: Tiếp tục stays off until this is empty. */
export function unsettledFields(fields: BriefField[], answers: Record<string, string>): BriefField[] {
  return fields.filter((field) => !isSettled(answers[field.key]));
}

/** How an answer reads to staff ("100 - 150 m²", "3 phòng", "chưa biết"). */
export function displayAnswer(field: BriefField, value: string): string {
  const v = value.trim();
  if (isUnknown(v)) return "chưa biết";
  if (field.kind === "area") return areaBandOption(v)?.label ?? v;
  if (field.kind === "number" && field.unit) return `${v} ${field.unit}`;
  return v;
}

/**
 * What the brief adds to a service lead's qualify data, as flat strings (qualify_data is
 * a flat key/value map): every field as a readable line ("chưa biết" included, so staff
 * see the visitor was asked and could not say), how many were really answered (which the
 * "Đủ thông tin báo giá" badge reads), and for a system installation the size band, so
 * the "Giá trị cao" badge works without a second "how big" question.
 */
export function buildBriefQualify(
  line: string,
  fields: BriefField[],
  answers: Record<string, string>,
): Record<string, string> {
  const settled = fields.filter((field) => isSettled(answers[field.key]));
  if (settled.length === 0) return {};

  const real = settled.filter((field) => !isUnknown(answers[field.key]));
  const qualify: Record<string, string> = {
    brief: settled.map((field) => `${field.label}: ${displayAnswer(field, answers[field.key])}`).join("\n"),
    briefAnswered: String(real.length),
    briefTotal: String(fields.length),
  };
  if (settled.length > real.length) qualify.briefUnknown = String(settled.length - real.length);

  if (line === "thi-cong") {
    const areaField = real.find((field) => field.kind === "area");
    const band = areaField ? areaBandOption(answers[areaField.key]) : undefined;
    if (areaField && band) {
      qualify.areaBand = band.value;
      qualify.scale = band.scale;
    } else {
      // A service whose area is still a free-text field (typed before this form had bands).
      const textArea = real.find((field) => field.kind === "text" && /diện tích/i.test(field.label));
      const m2 = textArea ? parseAreaM2(answers[textArea.key]) : null;
      if (m2 !== null) qualify.scale = areaBand(m2);
    }
  }
  return qualify;
}
