// Static copy for the homepage sections below the hero.
//
// Ownership rule (docs/rfc-seo-intent-architecture.md §2, §5): the homepage owns
// the BRAND ("Điện máy ELC") and the CONTRACTOR positioning ("nhà thầu / thi công
// điều hòa & thông gió"). It points to the page that owns every other intent and
// never lists products, models or prices — those belong to /san-pham/*.
//
// Every fact here comes from the about page (/thong-tin/gioi-thieu-ve-dien-may-elc),
// the published 5-step process, or the live site structure. Nothing about price,
// project duration or warranty length is stated, because the company has not
// published a fixed figure for them (see seo-harness/FACTS_NEEDED.md).

export const COMPANY = {
  legalName: "Công ty Cổ phần Giải pháp Công nghệ Thương mại Dịch vụ ELC",
  brand: "Điện máy ELC",
  founded: "25/11/2021",
} as const;

export interface HomeLink {
  label: string;
  href: string;
}

// "Bốn lối vào": what ELC builds. One H3 + one sentence + two links each.
export interface HomeEntry {
  title: string;
  text: string;
  links: HomeLink[];
}

export const HOME_ENTRIES: HomeEntry[] = [
  {
    title: "Điều hòa trung tâm VRV/VRF",
    text: "Một cụm dàn nóng nối nhiều dàn lạnh, điều khiển từng khu vực riêng. Phù hợp biệt thự, văn phòng, nhà hàng và cơ sở kinh doanh có nhiều phòng.",
    links: [
      { label: "Dịch vụ điều hòa trung tâm", href: "/dich-vu/dieu-hoa-trung-tam" },
      { label: "VRV cho công trình thương mại", href: "/dich-vu/dieu-hoa-trung-tam-vrv-cho-cong-trinh-thuong-mai-cong-nghiep" },
    ],
  },
  {
    title: "Điều hòa multi và split cho nhà ở",
    text: "Lắp đặt trọn gói máy lạnh treo tường, âm trần, giấu trần nối ống gió, áp trần và tủ đứng, có tư vấn công suất theo từng phòng.",
    links: [
      { label: "Cung cấp và lắp đặt máy lạnh", href: "/dich-vu/cung-cap-lap-dat-cac-dong-may-lanh" },
      { label: "Xem máy lạnh", href: "/san-pham/may-lanh" },
    ],
  },
  {
    title: "Cấp khí tươi thu hồi nhiệt (ERV/HRV)",
    text: "Đưa khí ngoài trời đã lọc vào phòng kín và thu hồi nhiệt từ khí thải, để điều hòa vẫn mát mà không khí trong nhà không bị ngột.",
    links: [
      { label: "Hệ thống cấp gió tươi thu hồi nhiệt", href: "/dich-vu/he-thong-cap-gio-tuoi-thu-hoi-nhiet" },
      { label: "Xem máy cấp khí tươi", href: "/san-pham/cap-khi-tuoi-thu-hoi-nhiet" },
    ],
  },
  {
    title: "Vận hành sau bàn giao",
    text: "Vệ sinh bảo trì định kỳ, sửa chữa, thu cũ đổi mới và cho thuê máy lạnh cho công trình ELC đã làm và cả máy đang dùng.",
    links: [
      { label: "Vệ sinh bảo trì máy lạnh", href: "/dich-vu/ve-sinh-bao-tri-cac-dong-may-lanh" },
      { label: "Sửa chữa máy lạnh", href: "/dich-vu/sua-chua-cac-dong-may-lanh" },
    ],
  },
];

// Intent router: a visitor says what kind of space they have, and lands on the
// service page that owns that need plus real projects of the same type.
export interface HomeIntent {
  space: string;
  need: string;
  service: HomeLink;
  projects: HomeLink;
}

export const HOME_INTENTS: HomeIntent[] = [
  {
    space: "Biệt thự, nhà ở cao cấp",
    need: "Nhiều phòng, cần điều hòa êm và không khí trong lành",
    service: { label: "VRV cho biệt thự và nhà ở", href: "/dich-vu/dieu-hoa-trung-tam-vrv-cho-biet-thu-nha-o" },
    projects: { label: "Dự án biệt thự", href: "/du-an/biet-thu" },
  },
  {
    space: "Văn phòng, showroom, trụ sở",
    need: "Diện tích lớn, nhiều người, cần điều khiển theo khu vực",
    service: { label: "VRV cho công trình thương mại", href: "/dich-vu/dieu-hoa-trung-tam-vrv-cho-cong-trinh-thuong-mai-cong-nghiep" },
    projects: { label: "Dự án văn phòng", href: "/du-an/van-phong" },
  },
  {
    space: "Nhà hàng, quán, cơ sở kinh doanh",
    need: "Đông người, nhiều mùi và hơi nóng, cần khí tươi",
    service: { label: "Cấp gió tươi thu hồi nhiệt", href: "/dich-vu/he-thong-cap-gio-tuoi-thu-hoi-nhiet" },
    projects: { label: "Dự án cơ sở kinh doanh", href: "/du-an/co-so-kinh-doanh" },
  },
  {
    space: "Nhà phố, căn hộ, chung cư",
    need: "Vài phòng, cần chọn đúng công suất và lắp gọn",
    service: { label: "Lắp đặt máy lạnh", href: "/dich-vu/cung-cap-lap-dat-cac-dong-may-lanh" },
    projects: { label: "Dự án nhà phố", href: "/du-an/nha-pho" },
  },
  {
    space: "Trường học, phòng khám, cơ sở y tế",
    need: "Phòng kín, cần khí sạch và vận hành ổn định",
    service: { label: "Cấp gió tươi thu hồi nhiệt", href: "/dich-vu/he-thong-cap-gio-tuoi-thu-hoi-nhiet" },
    projects: { label: "Dự án cơ sở y tế", href: "/du-an/y-te" },
  },
  {
    space: "Đang dùng máy lạnh, cần chăm sóc",
    need: "Máy kém mát, chảy nước, hoặc đã đến kỳ bảo trì",
    service: { label: "Vệ sinh bảo trì máy lạnh", href: "/dich-vu/ve-sinh-bao-tri-cac-dong-may-lanh" },
    projects: { label: "Sửa chữa máy lạnh", href: "/dich-vu/sua-chua-cac-dong-may-lanh" },
  },
];

// The five steps already published on the site as the "chìa khóa trao tay" frame.
export const HOME_PROCESS = [
  { title: "Khảo sát và tư vấn", text: "Xem bản vẽ hoặc khảo sát tại công trình, nghe nhu cầu và ngân sách của chủ nhà." },
  { title: "Thiết kế sơ đồ kỹ thuật", text: "Tính tải lạnh, chọn thiết bị, vẽ sơ đồ và bóc tách khối lượng để báo giá rõ từng hạng mục." },
  { title: "Chuẩn bị vật tư", text: "Nhập vật tư và thiết bị theo bản vẽ đã thống nhất với khách." },
  { title: "Thi công lắp đặt", text: "Đội thi công của ELC lắp đặt và giám sát tại công trình." },
  { title: "Kiểm tra vận hành, nghiệm thu", text: "Chạy máy, nghiệm thu thông số, bàn giao đưa vào sử dụng." },
] as const;

export const HOME_BRANDS = "Daikin, LG và Menred";

// Answers are written answer-first and use only facts listed at the top of this
// file. They are rendered visibly AND emitted as FAQPage JSON-LD from the same
// array (same single-source pattern as FAQAccordion).
export const HOME_FAQS: { question: string; answer: string }[] = [
  {
    question: "Điện máy ELC là công ty gì?",
    answer: `${COMPANY.brand} là tên thương mại của ${COMPANY.legalName}, thành lập ngày ${COMPANY.founded}. ELC là nhà thầu tư vấn, thiết kế, cung cấp và thi công hệ thống điều hòa không khí và cấp khí tươi thu hồi nhiệt, phục vụ khu vực TP.HCM và các tỉnh phía Nam.`,
  },
  {
    question: "Nhà thầu EPC điều hòa và thông gió nghĩa là gì?",
    answer:
      "EPC là Engineering, Procurement, Construction: một đơn vị nhận trọn gói thiết kế kỹ thuật, mua sắm thiết bị vật tư và thi công. Với điều hòa và thông gió, khách làm việc với một bên duy nhất từ khảo sát, bản vẽ, báo giá đến lắp đặt và bàn giao, thay vì tự ghép nhiều nhà thầu.",
  },
  {
    question: "HVAC và MV&AC là gì?",
    answer:
      "HVAC là viết tắt của Heating, Ventilation and Air Conditioning: sưởi, thông gió và điều hòa không khí. Ở Việt Nam không cần sưởi nên ELC dùng MV&AC (Mechanical Ventilation and Air Conditioning), gồm thông gió cơ khí như cấp khí tươi thu hồi nhiệt và điều hòa không khí như VRV/VRF, multi, split.",
  },
  {
    question: "ELC thi công những hệ thống nào?",
    answer:
      "ELC thi công điều hòa trung tâm VRV/VRF, điều hòa multi và split (treo tường, âm trần, giấu trần nối ống gió, áp trần, tủ đứng) và hệ thống cấp khí tươi thu hồi nhiệt ERV/HRV. Các hệ nước lạnh như chiller, AHU, FCU không nằm trong phạm vi hiện tại của ELC.",
  },
  {
    question: "Quy trình làm việc với ELC gồm những bước nào?",
    answer:
      "Gồm năm bước: khảo sát và tư vấn, thiết kế sơ đồ kỹ thuật, chuẩn bị vật tư, thi công lắp đặt, kiểm tra vận hành và nghiệm thu. Tư vấn, tính tải lạnh, bản vẽ, bóc khối lượng, thi công và giám sát đều do đội của ELC thực hiện, không giao thầu phụ.",
  },
  {
    question: "Cần chuẩn bị gì để ELC tư vấn và báo giá?",
    answer:
      "Nếu có, hãy gửi bản vẽ mặt bằng của công trình; chưa có bản vẽ thì ELC khảo sát tại chỗ. Chủ nhà chỉ làm việc với một đầu mối. ELC chọn thiết bị và gửi khách xem cùng báo giá, khách đồng ý rồi mới ký hợp đồng.",
  },
  {
    question: "ELC làm việc với những thương hiệu nào?",
    answer: `Thiết bị ELC cung cấp và lắp đặt đến từ ${HOME_BRANDS}. Chủng loại và mã máy được chọn theo tải lạnh tính cho từng công trình, không áp một mẫu cho mọi nhà.`,
  },
];
