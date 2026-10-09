# RFC: Kiến trúc SEO theo intent (mỗi URL một nhóm query)

**Status:** Bản thảo đã review 3 vòng (2026-10-09), CHƯA triển khai thay đổi nào lên production. Chờ duyệt mục "Cần duyệt".
Không đụng trang chủ: user sẽ làm lại trang chủ (kiểu Apple) cùng đợt UX/UI sau; mục "Đặc tả cho trang chủ" là đầu vào cho đợt đó.

## 1. Vấn đề (số liệu GSC 2025-06 -> 2026-10 + crawl 446 URL sống)

Cấu trúc dưới `/san-pham` đã đúng kiểu Điện Máy Xanh: "máy lạnh LG" -> `/san-pham/lg`, "máy lạnh tủ đứng" ->
`/may-lanh-tu-dung`, "máy lạnh treo tường" -> `/may-lanh-treo-tuong`, "máy lạnh daikin" -> `/daikin`.
Chồng lấn nằm ở **query đầu phễu** (post-migration, impression):

| Nhóm query | Impr | Đang rơi vào | Nên thuộc về |
|---|---|---|---|
| máy lạnh / điều hòa / máy điều hòa / điều hòa không khí | ~0.8k | `/` (~75%), `/san-pham` | `/san-pham/may-lanh` (chỉ 16 impr) |
| điều hòa thông gió | 244 | `/`, `/san-pham` | nhóm khí tươi (hiện 0-2 lần nhắc "thông gió") |
| máy lạnh trung tâm / công nghiệp / VRV | 564 | `/san-pham`, `/`, tin-tức | CHƯA có trang chủ sở hữu (B2B) |
| vệ sinh máy lạnh/điều hòa (+biến thể) | ~600 | `/` (pos 43-57) | `/dich-vu/ve-sinh-bao-tri-cac-dong-may-lanh` (pos 56, 54 impr) |
| lắp (đặt) máy lạnh | ~120 | `/`, `/san-pham` | `/dich-vu/cung-cap-lap-dat-cac-dong-may-lanh` |

Nguyên nhân đo được:
1. **Trang chủ, hub và group cùng nhắm "máy lạnh"**: số lần xuất hiện 75 / 48 / 100; title hub và title cũ của trang chủ cùng bộ ba "máy lạnh, khí tươi, lọc nước".
2. **Khoảng trống từ vựng**: query chứa "điều hòa/điều hoà" = 4.578 impr, ~43% nhu cầu của "máy lạnh" (6.121), nhưng trang chủ/hub/group chứa "điều hòa" 5 / 0 / 2 lần. "Máy điều hòa", "thông gió" gần như vắng mặt.
3. **Dịch vụ bị cô lập**: số trang nội bộ trỏ tới: vệ sinh 2, lắp đặt 3, sửa chữa 0 (trong khi `/dich-vu`, `/du-an`, mỗi group được 442/446 trang trỏ tới nhờ nav+footer). Link nội bộ khác không có link chết.
4. **Hai trang khí tươi trùng nhau**: group `cap-khi-tuoi-thu-hoi-nhiet` (28 sp, 2 category) và category con `may-cap-khi-tuoi-thu-hoi-nhiet` (25 sp): ~90% trùng, title gần giống, 2.202 / 2.392 từ.
5. **Không có trang B2B** cho cụm "trung tâm/VRV/công nghiệp" dù thi công dự án là mảng ưu tiên số 1 của chủ.
6. Trang nặng và chậm: HTML trang chủ 2,7MB, hub 1,5MB, group 1,4-1,6MB, TTFB 0,9-2s (GSC crawl stats TB 1,2-2,5s).

## 2. Bản đồ sở hữu intent (đích)

| Cụm query | URL sở hữu duy nhất | Ghi chú |
|---|---|---|
| Brand ("điện máy elc", "công ty elc") | `/` (+ giới thiệu, thông tin: đã pos 1, giữ) | trang chủ chỉ nhắm brand + định vị |
| Máy lạnh/điều hòa/máy điều hòa/điều hòa không khí, giá rẻ, mua | `/san-pham/may-lanh` | phải phủ đủ biến thể từ vựng |
| Loại lắp đặt (treo tường, âm trần, giấu trần, áp trần, tủ đứng) | category tương ứng | đang đúng, giữ |
| Hãng + máy lạnh (Daikin, LG, Panasonic) | brand page | đang đúng, giữ |
| Công suất (1HP, 1.5HP...) | hp_page | giữ |
| Điều hòa thông gió, khí tươi, thu hồi nhiệt (nhu cầu nhà ở/văn phòng) | MỘT trang khí tươi (xem quyết định D1) | |
| Máy lạnh trung tâm, VRV/VRF, công nghiệp, thiết kế-thi công | trang dịch vụ B2B mới (D2) + dự án làm bằng chứng | cần dữ liệu của chủ |
| Vệ sinh / lắp đặt / sửa / thu cũ-thanh lý / cho thuê | mỗi cụm 1 trang `/dich-vu/*` | cần link nội bộ + độ sâu |
| Kiến thức, hướng dẫn | `/tin-tuc/*` chỉ informational, không nhắm query thương mại | |
| Hub `/san-pham`, `/dich-vu`, `/du-an`, `/tin-tuc` | trang điều hướng, không tuyên bố query chung | |

Quy tắc từ vựng: mỗi trang sở hữu phải chứa cả "máy lạnh" và "điều hòa" (kể cả "điều hoà"/"máy điều hòa") tự nhiên trong title hoặc H1, đoạn mở đầu và FAQ.

## 3. Quyết định mở

- **D1 Khí tươi (trùng 90%)**: (a) gộp: 301 category -> group, group liệt kê cả 25 máy + 3 phụ kiện; hoặc (b) giữ hai trang nhưng phân vai: group = giải pháp/hệ thống (B2B, khảo sát, thiết kế), category = danh sách model. Khuyến nghị (a): chỉ có 1 category sản phẩm chính nên tầng group-category không thêm intent nào; nhưng đổi URL của trang có 43 impr/GSC, cần redirect tĩnh nginx + next.config.
- **D2 Trang B2B** (trung tâm/VRV/công nghiệp): cần từ chủ: hệ nào ELC thi công (VRV hãng nào, công suất tối đa), 3-5 dự án tiêu biểu, quy trình khảo sát-báo giá, có công khai giá không.
- **D3 Dịch vụ thu cũ**: `thanh-ly`, `thu-cu-doi-moi`, (legacy `thu-mua`) chồng lấn intent: giữ 2 trang phân biệt rõ (thanh lý/mua lại máy cũ vs thu cũ đổi mới khi mua mới) hay gộp 1.

## 4. Thay đổi đề xuất (chưa làm)

A. Metadata trong DB (`group_categories.meta_title/meta_description`; code tự thêm hậu tố " - MM/YYYY", nên không đưa ngày vào, giữ ≤ ~48 ký tự):
   - `may-lanh`: "Máy lạnh (điều hòa) chính hãng Daikin, LG giá rẻ"; mô tả nhắc "điều hòa/máy điều hòa". Đoạn mở đầu `content` phủ biến thể từ vựng (không đổi `name` vì dùng cho nav).
B. Metadata hub `/san-pham` nằm trong CODE (`app/(public)/san-pham/page.tsx`, khác title DB): đổi sang tên trung tính "Sản phẩm điện lạnh chính hãng | Điện Máy ELC" (hub không còn tuyên bố "máy lạnh"). Cần deploy.
C. Khí tươi: theo D1; thêm từ vựng "thông gió/điều hòa thông gió" vào mô tả và đoạn mở đầu của trang sở hữu.
D. Liên kết nội bộ cho dịch vụ (đụng UI nên gắn vào đợt UX/UI): dropdown "Dịch vụ" trong header liệt kê 7 dịch vụ; CTA "lắp đặt trọn gói" trên trang sản phẩm trỏ `/dich-vu/...lap-dat`; mỗi trang dịch vụ trỏ sang group/dự án liên quan; sửa 12 link footer có anchor rỗng tới `/san-pham` mỗi trang.
E. Dịch vụ: đối chiếu title/H1 theo cụm ("Vệ sinh máy lạnh/điều hòa tại nhà"), bảng giá (cần dữ liệu giá của chủ), FAQ. Không đổi slug (không có lịch sử URL, lợi ích nhỏ, thêm redirect).

## 5. Đặc tả cho trang chủ (đầu vào đợt UX/UI)

- Chỉ nhắm brand + định vị; một H1; title/description không lặp bộ ba từ khoá sản phẩm của `/san-pham`.
- Không lưới sản phẩm: dẫn tới 4 mảng bằng anchor chuẩn ("Máy lạnh" -> `/san-pham/may-lanh`, "Khí tươi", "Dịch vụ", "Dự án"); tối đa vài chục link.
- HTML < 500KB mục tiêu (< 2MB là giới hạn cứng của Googlebot), TTFB < 600ms; Organization/WebSite schema giữ.
- Lịch sử: ngày 2026-10-01 ba commit (`301de8f`, `7b40f99`, `fc6d521`) đã làm đúng hướng này (HTML 1,98MB -> 830KB) rồi bị revert, lý do không ghi lại. Đọc diff trước khi làm lại.

## 6. Đo lường

Baseline (post-migration): `/` 5.155 impr pos 56; `/san-pham` 3.275 impr pos 68; `/san-pham/may-lanh` 16 impr pos 51; dịch vụ vệ sinh 54 impr pos 56.
Thành công = cụm query đầu phễu chuyển sang URL sở hữu và vị trí cải thiện. Mốc kiểm tra: +4 tuần, +8 tuần, bằng `query_page` của GSC (cùng script phân tích trong `seo-audit/data/`). Không thay nhiều thứ cùng một ngày; ghi nhật ký ngày đổi từng trang.

## 7. Review log

- **Vòng 1**: (i) bản đầu đề xuất làm lại trang chủ ngay: sai, user sẽ tự làm và ba commit cũ đã bị revert -> bỏ, chuyển thành đặc tả. (ii) "bỏ lưới sản phẩm" từng là kết luận cũ của tôi dựa trên cannibalization trang chủ; số liệu cho thấy nguyên nhân còn gồm từ vựng + dịch vụ cô lập -> mở rộng phạm vi.
- **Vòng 2**: kiểm chứng giả thuyết bằng dữ liệu thay vì suy đoán: khoảng trống từ vựng (4.578 vs 6.121 impr), link nội bộ (2/3/0), trùng khí tươi 28 vs 25 sp (đọc DB). Phát hiện metadata hub nằm trong code chứ không phải DB -> tách thay đổi A (DB) và B (code).
- **Vòng 3**: rủi ro còn lại: (1) đổi hậu tố ngày: code tự thêm nên không đưa vào DB; (2) hub mất impression: pos 68, 2 click, không đáng giữ; (3) gộp D1 đổi URL: cần redirect ở CẢ nginx tĩnh và next.config (xem `rfc-crawl-budget-410-allowlist.md`); (4) phụ thuộc dữ liệu chủ (D2, giá dịch vụ): ghi rõ, không tự bịa số; (5) trùng việc với đợt UX/UI: mục D chuyển sang đợt đó.
