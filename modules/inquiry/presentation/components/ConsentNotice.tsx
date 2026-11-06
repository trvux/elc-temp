import { PRIVACY_POLICY_PATH } from "../../domain/consent";

// The line under the last field of the lead form. Sending the form is the act of agreeing, so
// this has to say plainly what for and where to read more. Wording changes must also change
// FORM_CONSENT_VERSION (modules/inquiry/domain/consent.ts).
export function ConsentNotice() {
  return (
    <p className="type-legal mt-6 max-w-lg text-white/80 drop-shadow-sm">
      Bằng việc bấm &ldquo;Gửi yêu cầu&rdquo;, bạn đồng ý để Điện máy ELC dùng họ tên, số điện thoại và thông tin bạn cung cấp để
      liên hệ tư vấn, báo giá. Xem{" "}
      <a href={PRIVACY_POLICY_PATH} target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2">
        Chính sách thu thập và xử lý dữ liệu cá nhân
      </a>
      .
    </p>
  );
}
