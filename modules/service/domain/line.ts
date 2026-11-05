// The two offerings a service belongs to. Replaces service groups: it picks the
// hub section, the wording of the Zalo call-to-action and message, and is a
// dimension for tracking. Pure data and helpers, no React, so it is cheap to test.
//
// Every call-to-action on a service opens a Zalo conversation (the sale happens
// there, by quote), so the copy here is written for that conversation.

export type ServiceLine = "thi-cong" | "dich-vu";

export interface ServiceLineInfo {
  /** Hub section heading, page eyebrow and the admin select option. */
  label: string;
  /** One sentence under the hub section heading. */
  hubIntro: string;
  /** Label of the Zalo button. */
  ctaLabel: string;
  /** First line of the pre-filled Zalo message. */
  messageOpener: string;
  /** Heading of the "what to send" block on the detail page. */
  briefHeading: string;
}

export const SERVICE_LINES: Record<ServiceLine, ServiceLineInfo> = {
  "thi-cong": {
    label: "Thi công hệ thống",
    hubIntro:
      "Điều hòa trung tâm VRV, hệ thống cấp gió tươi thu hồi nhiệt và lắp đặt máy lạnh cho nhà ở, thương mại và công trình.",
    ctaLabel: "Nhận khảo sát và báo giá",
    messageOpener: "Chào ELC, tôi muốn nhận khảo sát và báo giá:",
    briefHeading: "Gửi sẵn những thông tin này để được báo giá nhanh hơn",
  },
  "dich-vu": {
    label: "Dịch vụ máy lạnh",
    hubIntro: "Vệ sinh bảo trì, sửa chữa, cho thuê và thu cũ đổi mới cho máy lạnh bạn đang dùng.",
    ctaLabel: "Đặt lịch",
    messageOpener: "Chào ELC, tôi muốn đặt lịch dịch vụ:",
    briefHeading: "Chuẩn bị sẵn những thông tin này để đặt lịch nhanh hơn",
  },
};

/** Hub order: the main business first. */
export const SERVICE_LINE_ORDER: readonly ServiceLine[] = ["thi-cong", "dich-vu"];

/** Anything that is not exactly "thi-cong" is a regular service (the column default). */
export function normalizeServiceLine(value: string | null | undefined): ServiceLine {
  return value === "thi-cong" ? "thi-cong" : "dich-vu";
}

/** Services grouped by line in hub order; a line with no service is left out. */
export function groupServicesByLine<T extends { line: ServiceLine }>(
  services: T[],
): Array<{ line: ServiceLine; services: T[] }> {
  return SERVICE_LINE_ORDER.map((line) => ({
    line,
    services: services.filter((s) => s.line === line),
  })).filter((section) => section.services.length > 0);
}
