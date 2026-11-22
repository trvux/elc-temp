import { buildFrontmatter, buildInquirySection, TRUST_PAGES } from "@/shared/lib/agent-markdown/render";
import { richTextToMarkdown } from "@/shared/lib/agent-markdown/richtext-to-markdown";
import { SERVICE_AREA_PROVINCES } from "@/shared/lib/service-areas";
import { AREA_BANDS } from "@/modules/inquiry/domain/area";
import {
  CONDITION_OPTIONS, CONTACT_PREFERENCE_OPTIONS, DEVICE_COUNT_OPTIONS, PRODUCT_BUDGET_OPTIONS, PRODUCT_URGENCY_OPTIONS,
  SERVICE_URGENCY_OPTIONS, SITE_VISIT_OPTIONS, YES_NO_OPTIONS, WATER_FILTER_HOUSEHOLD_OPTIONS,
  PROJECT_STAGE_OPTIONS, ROLE_OPTIONS, type ChoiceOption,
} from "@/modules/inquiry/domain/qualify-options";
import { MAX_FILES } from "@/modules/inquiry/domain/attachments";
import { BASE_URL } from "@/shared/lib/seo-schema";

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

function dateOnly(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export interface StaticPageInput {
  title: string;
  slug: string;
  content: unknown;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function buildStaticPageMarkdown(p: StaticPageInput): string {
  const url = `${BASE_URL}/${p.slug}`;
  const title = oneLine(p.title);
  const description = p.metaDescription ? oneLine(p.metaDescription) : title;
  const out: string[] = [
    buildFrontmatter({ title: oneLine(p.metaTitle || p.title), description, canonicalUrl: url, updatedAt: p.updatedAt || undefined }),
    `# ${title}`,
    "",
  ];
  const created = dateOnly(p.createdAt);
  const updated = dateOnly(p.updatedAt);
  const meta: string[] = [];
  if (created) meta.push(`Đăng ngày: ${created}`);
  if (updated && updated !== created) meta.push(`Cập nhật: ${updated}`);
  if (meta.length) out.push(meta.join(" · "), "");
  const body = richTextToMarkdown(p.content, { baseUrl: BASE_URL });
  if (body) out.push(body, "");
  out.push(`Bản HTML: [${url}](${url}) · [Thông tin & chính sách](${TRUST_PAGES.contact})`, "", buildInquirySection());
  return out.join("\n");
}

export interface BranchMarkdownInput {
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  mapsUrl?: string | null;
  description?: unknown;
  metaDescription?: string | null;
  updatedAt?: string | null;
}

function branchFacts(b: BranchMarkdownInput): string[] {
  const out: string[] = [];
  if (b.address) out.push(`- **Địa chỉ**: ${oneLine(b.address)}`);
  if (b.phone) out.push(`- **Điện thoại**: ${oneLine(b.phone)}`);
  if (b.email) out.push(`- **Email**: ${oneLine(b.email)}`);
  if (b.mapsUrl) out.push(`- **Bản đồ**: ${b.mapsUrl}`);
  return out;
}

export function buildBranchMarkdown(b: BranchMarkdownInput): string {
  const url = `${BASE_URL}/thong-tin/${b.slug}`;
  const name = oneLine(b.name);
  const out: string[] = [
    buildFrontmatter({
      title: `${name} | Điện máy ELC`,
      description: b.metaDescription ? oneLine(b.metaDescription) : b.address ? oneLine(b.address) : name,
      canonicalUrl: url,
      updatedAt: b.updatedAt || undefined,
    }),
    `# ${name}`,
    "",
  ];
  const facts = branchFacts(b);
  if (facts.length) out.push("## Thông tin liên hệ", "", ...facts, "");
  const body = richTextToMarkdown(b.description, { baseUrl: BASE_URL });
  if (body) out.push(body, "");
  out.push(`Bản HTML: [${url}](${url}) · [Tất cả chi nhánh](${TRUST_PAGES.contact})`, "", buildInquirySection());
  return out.join("\n");
}

export interface InfoHubInput {
  pages: Array<{ title: string; slug: string }>;
  branches: BranchMarkdownInput[];
}

export function buildInfoHubMarkdown(input: InfoHubInput): string {
  const description =
    "Địa chỉ văn phòng, showroom, kho bãi kỹ thuật của Điện máy ELC — thông tin liên hệ, bản đồ và giờ làm việc từng chi nhánh.";
  const out: string[] = [
    buildFrontmatter({ title: "Thông tin liên hệ & chi nhánh | Điện máy ELC", description, canonicalUrl: TRUST_PAGES.contact }),
    "# Thông tin về ELC",
    "",
    "> Các chính sách thương mại và dịch vụ công ty cam kết luôn luôn theo đuổi cam kết thực hiện",
    "",
    "## Giới thiệu và chính sách",
    "",
  ];
  if (input.pages.length === 0) out.push("Chưa có thông tin nào được cập nhật.", "");
  else {
    for (const p of input.pages) out.push(`- [${oneLine(p.title)}](${BASE_URL}/${p.slug})`);
    out.push("");
  }
  out.push(
    "## Cơ sở hạ tầng",
    "",
    "Hệ thống không gian trưng bày và trạm dịch vụ của ELC được mở rộng trên toàn quốc với triết lý kiến tạo giá trị đồng nhất",
    "",
  );
  for (const b of input.branches) {
    out.push(`### [${oneLine(b.name)}](${BASE_URL}/thong-tin/${b.slug})`, "", ...branchFacts(b), "");
  }
  out.push(buildInquirySection());
  return out.join("\n");
}

export function buildPageNotFoundMarkdown(): string {
  return [
    "# 404 Không tìm thấy trang",
    "",
    "Trang này không tồn tại hoặc đã bị gỡ.",
    "",
    `- [Thông tin & chính sách](${TRUST_PAGES.contact})`,
    `- [Sitemap](${BASE_URL}/sitemap.xml)`,
    "",
  ].join("\n");
}

// /form is a client-side wizard (modules/inquiry/presentation/components/LeadFormScreen.tsx, step list
// built in its `steps` memo). This documents the whole flow as labels only; option sets are imported
// from the same domain files the form uses so the two cannot drift. Static: no DB read, no user data.
const opts = (o: readonly ChoiceOption[]) => o.map((x) => x.label).join("; ");

export function buildFormMarkdown(): string {
  const url = `${BASE_URL}/form`;
  const description =
    "Biểu mẫu nhiều bước gửi yêu cầu tư vấn hoặc báo giá tới Điện máy ELC: chọn nhu cầu, trả lời vài câu hỏi, chọn khu vực và để lại thông tin liên hệ.";
  const common = [
    `Gửi ảnh/tệp (không bắt buộc, PDF, DWG, DXF hoặc ảnh, tối đa ${MAX_FILES} tệp, mỗi tệp 15 MB)`,
    `Khu vực (bắt buộc): chọn một tỉnh/thành trong ${SERVICE_AREA_PROVINCES.join(", ")} hoặc "Nơi khác" rồi nhập tỉnh/thành phố. Địa chỉ cụ thể (không bắt buộc)`,
  ];
  const tail = (extra: string[] = []) => [
    ...extra,
    `Bạn muốn được liên hệ qua? ${opts(CONTACT_PREFERENCE_OPTIONS)}`,
    "Họ tên (bắt buộc, ít nhất 2 ký tự)",
    "Số điện thoại (bắt buộc, số di động Việt Nam đầu 03/05/07/08/09)",
  ];
  const list = (items: string[]) => items.map((x, i) => `${i + 1}. ${x}`);
  return [
    buildFrontmatter({ title: "Yêu cầu tư vấn / báo giá | Điện máy ELC", description, canonicalUrl: url }),
    "# Yêu cầu tư vấn / báo giá",
    "",
    "Biểu mẫu là trình hướng dẫn nhiều bước chạy trên trình duyệt (mỗi màn một câu hỏi, có nút Quay lại và Tiếp tục). ELC báo giá theo từng công trình, không bán qua giỏ hàng. Trang này mô tả các câu hỏi để bạn biết cần chuẩn bị gì; để gửi yêu cầu hãy mở bản HTML.",
    "",
    `Bản HTML: [${url}](${url})`,
    "",
    "## Bước 1: Bạn đang cần gì hôm nay?",
    "",
    `- **Mua sản phẩm**: Máy lạnh, máy lọc không khí, hệ thống khí tươi... Xem [sản phẩm](${BASE_URL}/san-pham).`,
    `- **Thi công hệ thống cho công trình**: Điều hòa trung tâm VRV, cấp gió tươi thu hồi nhiệt, lắp đặt máy lạnh... Xem [dịch vụ](${BASE_URL}/dich-vu).`,
    `- **Dịch vụ máy lạnh**: Vệ sinh bảo trì, sửa chữa, thu cũ đổi mới, cho thuê... Xem [dịch vụ](${BASE_URL}/dich-vu).`,
    "",
    "## Nhánh 1: Mua sản phẩm",
    "",
    ...list([
      "Bạn quan tâm dòng sản phẩm nào? (chọn một dòng sản phẩm của ELC, hoặc \"Bỏ qua, chỉ cần tư vấn chung\"; bỏ qua nếu form được mở từ trang một sản phẩm cụ thể)",
      `Câu hỏi quy mô, tùy dòng sản phẩm: máy lạnh \"Công suất máy cần lắp?\" (các mức HP của ELC) hoặc \"Quy mô/công suất cần lắp?\" (Dưới 20m²; 20 - 40m²; Trên 40m²; Chưa rõ); máy lọc/cấp khí tươi \"Lưu lượng cấp gió cần lắp?\" hoặc \"Diện tích/quy mô cần lắp hệ thống?\"; phụ kiện và nhà thông minh \"Số lượng thiết bị cần lắp?\" (${opts(DEVICE_COUNT_OPTIONS)}); máy lọc nước \"Gia đình/cơ sở có bao nhiêu người sử dụng?\" (${opts(WATER_FILTER_HOUSEHOLD_OPTIONS)})`,
      `Ngân sách dự kiến? Các mức theo giá thực tế của dòng đã chọn (máy lạnh tham khảo: ${opts(PRODUCT_BUDGET_OPTIONS)})`,
      `Chỉ với máy lạnh: Có máy cũ cần thu đổi không? (${opts(YES_NO_OPTIONS)}). Nếu có: Đời máy / hãng máy cũ? (không bắt buộc, nhập tự do) và Tình trạng máy hiện tại? (${opts(CONDITION_OPTIONS)})`,
      `Thời gian mong muốn? ${opts(PRODUCT_URGENCY_OPTIONS)}`,
      `${common[0]}. Bỏ qua bước này với phụ kiện và nhà thông minh`,
      common[1],
      "Còn điều gì khác bạn muốn nói không? (ghi chú, không bắt buộc)",
      ...tail(),
    ]),
    "",
    "## Nhánh 2: Thi công hệ thống cho công trình",
    "",
    ...list([
      "Bạn cần thi công hạng mục nào? (chọn một dịch vụ thuộc mảng Thi công hệ thống, hoặc \"Chưa rõ, cần tư vấn chọn dịch vụ\")",
      "Thông tin giúp báo giá nhanh hơn (chỉ hiện khi dịch vụ đã chọn có mục riêng): các mục (do ELC cấu hình, dạng văn bản ngắn, số, chọn một, có/không hoặc diện tích theo khoảng: " + opts(AREA_BANDS) + "). Mỗi mục phải trả lời hoặc bấm \"Chưa biết\" mới đi tiếp",
      `Bạn có muốn hẹn khảo sát công trình miễn phí không? ${opts(SITE_VISIT_OPTIONS)}`,
      "Gửi bản vẽ mặt bằng hoặc ảnh hiện trạng nếu có? (không bắt buộc, PDF, DWG, DXF hoặc ảnh, tối đa " + MAX_FILES + " tệp, mỗi tệp 15 MB)",
      common[1],
      ...tail(),
    ]),
    "",
    "## Nhánh 3: Dịch vụ máy lạnh",
    "",
    ...list([
      "Bạn cần dịch vụ nào? (chọn một dịch vụ thuộc mảng Dịch vụ máy lạnh, hoặc \"Chưa rõ, cần tư vấn chọn dịch vụ\")",
      "Thông tin giúp báo giá nhanh hơn: như nhánh 2, chỉ hiện khi dịch vụ đã chọn có mục riêng",
      `Thời gian mong muốn? ${opts(SERVICE_URGENCY_OPTIONS)}`,
      "Gửi ảnh tình trạng máy nếu có? (không bắt buộc, cùng giới hạn tệp)",
      common[1],
      ...tail(),
    ]),
    "",
    "Hai nhánh dịch vụ không có ô ghi chú riêng; nội dung chi tiết nằm ở các mục thông tin của dịch vụ.",
    "",
    "## Nhánh mở từ trang dự án (không có trong menu bước 1)",
    "",
    "Khi mở biểu mẫu từ một trang dự án (`entityKind=project`), form hỏi thêm:",
    "",
    ...list([
      "Loại công trình của bạn? (chọn một loại hoặc \"Chưa rõ, cứ để tư vấn viên gợi ý\")",
      "Công trình cần lắp những dòng máy nào? (chọn nhiều dòng máy, máy lạnh và máy lọc không khí, hoặc \"Chưa rõ, để tư vấn viên khảo sát\")",
      "Quy mô ước tính? (các mức m² tham khảo theo loại công trình, có Chưa rõ)",
      "Ngân sách dự kiến? (các mức triệu/tỷ tham khảo theo loại công trình, có \"Chưa rõ, cần tư vấn\")",
      `Giai đoạn hiện tại của công trình? ${opts(PROJECT_STAGE_OPTIONS)}`,
      `Vai trò của bạn? ${opts(ROLE_OPTIONS)}`,
      `Bạn có muốn hẹn khảo sát công trình miễn phí không? ${opts(SITE_VISIT_OPTIONS)}`,
      "Gửi ảnh mặt bằng / công trình nếu có? (không bắt buộc)",
      "Công trình ở khu vực nào? (như trên)",
      "Còn điều gì khác bạn muốn nói không? (không bắt buộc)",
      `Bạn muốn được liên hệ qua? ${opts(CONTACT_PREFERENCE_OPTIONS)}`,
      "Họ tên (bắt buộc), Số điện thoại (bắt buộc), Email (không bắt buộc, để gửi báo giá/hồ sơ chi tiết)",
    ]),
    "",
    "## Dữ liệu được gửi",
    "",
    "- Liên hệ: họ tên, số điện thoại, cách liên hệ ưa thích; email (chỉ nhánh dự án); ghi chú (chỉ nhánh sản phẩm và dự án).",
    "- Nhu cầu: loại yêu cầu (sản phẩm, dịch vụ hoặc dự án), sản phẩm/dịch vụ/dự án đã chọn và toàn bộ câu trả lời khảo sát ở trên.",
    "- Khu vực, địa chỉ cụ thể (không bắt buộc) và tệp đính kèm (không bắt buộc).",
    "- Sản phẩm, dịch vụ hoặc dự án đang xem được gắn sẵn khi mở form với các tham số `productId`, `projectId`, `serviceId`, `entityName`, `entityKind` (`product`, `project` hoặc `service`); `returnTo` là đường dẫn quay lại khi thoát.",
    "- Bấm \"Gửi yêu cầu\" ở bước cuối là đồng ý để Điện máy ELC dùng họ tên, số điện thoại và thông tin đã cung cấp để liên hệ tư vấn, báo giá. Xem [Chính sách thu thập và xử lý dữ liệu cá nhân](" + BASE_URL + "/chinh-sach-thu-thap-va-xu-ly-du-lieu-ca-nhan).",
    "- Sau khi gửi: \"Đã gửi yêu cầu tư vấn! Điện máy ELC sẽ liên hệ với bạn trong thời gian sớm nhất.\"",
    "",
    "## Liên hệ trực tiếp",
    "",
    `Điện thoại, Zalo và địa chỉ các chi nhánh: [trang liên hệ](${TRUST_PAGES.contact}).`,
    "",
  ].join("\n");
}
