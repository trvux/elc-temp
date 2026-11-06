# RFC: tái cấu trúc dịch vụ (schema, hub, trang chi tiết, Zalo)

**Status:** Đề xuất 2026-11-06. Pha A, B, C, D đã chạy trên live (line, bỏ nhóm/giá, khối dịch vụ trên trang sản phẩm, form 3 cửa, tracking). Còn lại: **brief có kiểu** (mục "Brief có kiểu" bên dưới), code xong 2026-11-06, chờ deploy và chạy seed; khối "Dự án đã thực hiện" trên trang dịch vụ chưa làm.

## Vấn đề

Dịch vụ của ELC bán bằng khảo sát rồi báo giá, hoặc bằng dự án thi công. Không niêm yết giá. **Mọi CTA đều đi qua Zalo** (conversational commerce): khách bấm nút, tin nhắn được chuẩn bị sẵn, khách dán vào Zalo, nhân viên trả lời báo giá. Nhưng schema và UI vẫn xây như shop bán hàng:

| Thứ đang có | Thực tế |
|---|---|
| `original_price`, `sale_price`, `discount_percent`, `price_display_text` | Cả 8 dịch vụ là "Liên hệ..." hoặc rỗng. Card hub hiện "Liên hệ để nhận giá ưu đãi" ở 8 thẻ: chữ không mang thông tin nào |
| Tin nhắn Zalo (`buildZaloServiceMessage`) | Chỉ có tên dịch vụ, dòng giá "Liên hệ", link. Nhân viên nhận tin vẫn phải hỏi lại từ đầu: ở đâu, bao nhiêu máy, diện tích |
| `service_groups` (6 nhóm) | 4 nhóm chỉ có 0 hoặc 1 dịch vụ. Gánh 3 việc: chia mảng hub, trang landing nhóm, câu hỏi form tư vấn |
| `/dich-vu/[slug]` phục vụ cả nhóm lẫn dịch vụ | Chung namespace. Sitemap đang liệt kê `/dich-vu/cung-cap-lap-dat` (nhóm) nhưng nginx trả 410 |
| `category_id`, `is_featured`, `group.category_ids`, `group.image_url` | Toàn rỗng hoặc false |
| `project_service` | Chỉ 3/8 dịch vụ có dự án gắn; trang chi tiết không hiện dự án |

## Nguyên tắc

1. Mô hình hóa theo **ý định của khách**, không theo giá.
2. **Tin nhắn Zalo là sản phẩm.** Trang dịch vụ có nhiệm vụ làm khách bắt đầu cuộc trò chuyện *kèm đúng thông tin* để nhân viên báo giá được ngay.
3. Mọi dữ kiện nhân viên cần nằm trong **dữ liệu sửa được ở admin**, không hardcode.

| Mảng (`line`) | Khách đang nghĩ | Dịch vụ | Động từ trong nút và tin nhắn |
|---|---|---|---|
| `thi-cong` Thi công hệ thống | "Công trình của tôi cần hệ thống điều hòa / thông gió" | VRV nhà ở, VRV thương mại và công nghiệp, cấp gió tươi thu hồi nhiệt, lắp đặt máy lạnh | "Nhận khảo sát và báo giá" |
| `dich-vu` Dịch vụ máy lạnh | "Máy lạnh tôi đang có cần xử lý" | Vệ sinh bảo trì, sửa chữa, cho thuê, thu cũ đổi mới | "Đặt lịch" |

Cả hai đều mở Zalo. `line` chỉ quyết định lời nút, câu mở đầu tin nhắn, mảng trên hub, và là một chiều (dimension) cho tracking.

## ERD v2

```
services                                      project_service (giữ)       faqs (giữ, owner_type='service')
  id, slug, title                               service_id --+
  line  CHECK IN ('thi-cong','dich-vu')         project_id   |            inquiries.service_id (giữ)
  description   (tóm tắt cho card/SEO)                       |
  labels text[] (điểm tin cậy: "Khảo sát      services <-----+
          miễn phí", "Bảo hành 24 tháng")
  brief_prompts text[]  <-- MỚI: thông tin khách cần gửi để được báo giá
  content jsonb (TipTap), images jsonb
  meta_title, meta_description
  is_published, order_index, timestamps
```

Bỏ: `service_groups` (cả bảng), `group_id`, `category_id`, `original_price`, `sale_price`, `discount_percent`, `price_display_text`, `is_featured`.
Giữ: `title_align` (admin còn dùng `TitleAlignField`).
Không thêm `price_from`: ELC không hiện giá cho dịch vụ.

### `brief_prompts`: cột mới quan trọng nhất

Mỗi dịch vụ có danh sách ngắn "nhân viên cần biết gì để báo giá". Dùng ở hai nơi từ **một nguồn**:

1. Trang chi tiết: khối "Gửi sẵn những thông tin này để được báo giá nhanh hơn" cạnh nút.
2. Tin nhắn Zalo: các dòng để khách điền.

```
Chào ELC, tôi muốn nhận khảo sát và báo giá: Điều hòa trung tâm VRV cho biệt thự và nhà ở
Link: https://dienmayelc.com.vn/dich-vu/dieu-hoa-trung-tam-vrv-cho-biet-thu-nha-o

- Địa chỉ công trình:
- Số tầng và tổng diện tích sàn:
- Số phòng cần làm lạnh:
- Đã có bản vẽ mặt bằng chưa (gửi ảnh nếu có):
- Thời gian dự kiến thi công:
```

Bản nháp nội dung ban đầu (sếp xem và sửa trong admin, tao không biết quy trình báo giá thật của ELC):

| Dịch vụ | `brief_prompts` nháp |
|---|---|
| VRV nhà ở | Địa chỉ công trình; Số tầng và tổng diện tích sàn; Số phòng cần làm lạnh; Đã có bản vẽ mặt bằng chưa; Thời gian dự kiến thi công |
| VRV thương mại và công nghiệp | Địa chỉ và loại công trình (văn phòng, nhà hàng, xưởng...); Diện tích cần điều hòa; Công trình mới hay đang hoạt động; Bản vẽ mặt bằng nếu có; Thời gian dự kiến |
| Cấp gió tươi thu hồi nhiệt | Loại công trình và diện tích; Số người thường xuyên sử dụng; Đã hoàn thiện (có trần giả) hay đang xây; Vấn đề đang gặp (ngộp, bụi, mùi...) |
| Lắp đặt máy lạnh | Địa chỉ; Số máy và công suất (HP) hoặc loại máy; Đã mua máy chưa, hãng nào; Treo tường, âm trần hay giấu trần |
| Vệ sinh bảo trì | Địa chỉ; Số máy và loại máy; Lần vệ sinh gần nhất |
| Sửa chữa | Hãng và model máy; Triệu chứng hoặc mã lỗi; Địa chỉ; Ảnh hoặc video lỗi nếu có |
| Cho thuê | Mục đích và thời gian thuê; Số lượng và công suất cần; Địa điểm |
| Thu cũ đổi mới | Hãng, loại, số năm sử dụng của máy cũ; Số lượng; Địa chỉ; Muốn đổi sang máy nào |

## Tracking (thiết kế cấu trúc ngay, làm ở Pha D)

Mỗi lần khách bấm nút Zalo phát **một sự kiện** với cùng tham số trên GA4, GTM và Ads:

| Tham số | Giá trị |
|---|---|
| `service_slug` | slug dịch vụ |
| `service_line` | `thi-cong` hoặc `dich-vu` |
| `cta_placement` | thẻ hub, đầu trang chi tiết, cuối trang chi tiết, khối trên trang sản phẩm |
| `channel` | `zalo` |

Cột `line` và `slug` ổn định là điều kiện để báo cáo "mảng nào ra lead" không cần đổi schema lần nữa.

## Tác động lên từng phần

| Phần | Thay đổi |
|---|---|
| Hub `/dich-vu` | 2 section theo `line`, mỗi section có tiêu đề + 1 câu intent. Card bỏ dòng giá. H1/metadata viết lại theo định vị nhà thầu EPC |
| Card | Tóm tắt + `labels` + nút theo mảng. Không giá |
| Chi tiết | Nhãn trên tiêu đề lấy từ `line`. Bỏ nhánh "Từ X đ". Thêm khối `brief_prompts` và khối "Dự án đã thực hiện" từ `project_service` |
| Tin nhắn Zalo | Đổi `buildZaloServiceMessage` thành mẫu có `brief_prompts`, bỏ dòng giá |
| JSON-LD | `serviceType` theo `line`; hub dùng `ItemList` |
| Admin | Form: ô chọn Mảng thay ô Nhóm; ô nhập `brief_prompts` (mỗi dòng một ý); bỏ chế độ giá. Bỏ trang Nhóm dịch vụ và mục sidebar |
| Sitemap, `/dich-vu/[slug]` | Bỏ trang landing nhóm |
| Menu | Bật lại mục Dịch vụ sau khi hub xong |

## Triển khai

**Pha A, expand (không phá):**
1. Migration thêm `services.line` (CHECK) và `services.brief_prompts`; backfill `line` từ nhóm cũ, `brief_prompts` từ bảng nháp trên. Cột cũ giữ nguyên, nullable.
2. Go: nhận và trả `line`, `brief_prompts`; không còn đọc/ghi cột giá và nhóm. `ServiceGroupRef` trong module project đổi sang `line`.
3. FE: hub, card, chi tiết, admin form, tin nhắn Zalo, sitemap.
4. Thử migration trên DB tạm local trước. Deploy Go trước (chịu được FE cũ), FE sau.

**Pha B, contract, làm ngay sau khi Pha A chạy tốt trên live (không chờ):** xóa `service_groups`, các cột chết, module Go `service-group`, trang admin Nhóm dịch vụ, mục sidebar. Backup trước, đã có quy trình 2 pha như lần gỡ shipping. Lý do không cần chờ: traffic thấp, rủi ro thấp.

**Pha C:** bảng `service_categories` (dịch vụ gắn danh mục sản phẩm). Trang sản phẩm có khối "Dịch vụ lắp đặt", trang dịch vụ có khối sản phẩm liên quan. Lấp khoảng trống "giá trọn gói lắp đặt" đã ghi trong memory.

**Pha D (riêng, sau hub):** làm lại form tư vấn theo dịch vụ + **toàn bộ tracking** (GA4, GTM, Ads conversion) trong một lượt, theo bảng tham số ở trên. Không đụng form và tracking ở Pha A.

## Rủi ro

- Trang landing nhóm đã 410 sẵn nên bỏ đi không mất URL nào đang có thứ hạng.
- `project.service.group` trong Go (`ServiceGroupRef`) phải đổi cùng đợt, nếu không API dự án vỡ.
- `brief_prompts` bản nháp do tao viết theo thông lệ ngành, chưa qua sếp. Phải đánh dấu để sếp duyệt trước khi coi là nội dung chính thức.
- Pha A không đổi form tư vấn và tracking nên không ảnh hưởng chuyển đổi Ads hiện có.

## Brief có kiểu (`brief_fields`)

`brief_prompts` (chuỗi tự do) không đủ để form khách thu thập dữ liệu dùng được: không biết câu nào là số, câu nào là lựa chọn, và nhiều câu ghép hai ý ("Số tầng **và** tổng diện tích sàn"). Thay bằng `services.brief_fields jsonb`, mỗi phần tử:

```
{ "key": "area_m2", "label": "Diện tích cần làm lạnh", "kind": "area" }
```

| kind | Form khách hiển thị | Lưu |
|---|---|---|
| `text` | một dòng chữ | chuỗi |
| `number` (+ `unit`) | số nhỏ kèm đơn vị | chuỗi số |
| `choice` (+ `options`) | chip chọn một | lựa chọn |
| `yesno` | Có / Không | "Có" / "Không" |
| `area` | 8 dải diện tích (dưới 50 m² đến trên 1.000 m²) | mã dải ("100-150") |

- Mọi ô có chip **"Chưa biết"** và nút "Chưa biết hết, để nhân viên hỏi lại". Tiếp tục chỉ bật khi mọi ô đã điền hoặc đánh dấu. "Chưa biết" lưu là `(chưa biết)`, khác ô trống; badge "Đủ thông tin báo giá" chỉ đếm câu trả lời thật.
- `key` ổn định (sinh từ nhãn, giữ nguyên khi sửa nhãn), để đổi chữ câu hỏi không làm mất nghĩa dữ liệu cũ.
- Dải diện tích mịn có chủ đích: gộp lại sau được, tách thì không. Mỗi dải ánh xạ về 4 mã `scale` cũ nên badge "Giá trị cao" (> 1.000 m²) giữ nguyên. ELC chưa có số liệu diện tích công trình của riêng mình; xem lại các dải sau khoảng 30 lead qua form.
- Khu vực luôn hỏi riêng (bắt buộc, chip 14 tỉnh từ `shared/lib/service-areas.ts`, chung nguồn với JSON-LD `areaServed`) kèm địa chỉ cụ thể không bắt buộc. Chọn "Nơi khác" thì lead mang `khuVucNgoai=1` và badge "Ngoài khu vực". Mục hỏi địa chỉ/bản vẽ/ảnh vẫn nằm trong danh sách (trang và tin nhắn Zalo cần) nhưng form bỏ qua vì đã có bước riêng.
- Tracking: `lead_form_step` (mỗi lần một bước hiện ra) và `lead_form_unknown` (mỗi lần đánh dấu chưa biết).

**Triển khai (expand/contract):** migration 000011 thêm cột, `brief_prompts` giữ nguyên làm đường lùi; chưa có `brief_fields` thì đọc `brief_prompts` như các ô text. Deploy Go trước, FE sau, rồi chạy seed bản nháp (`brief_fields` cho 8 dịch vụ, sếp sửa trong admin). Khi mọi dịch vụ đã có field có kiểu thì mới bỏ cột `brief_prompts` (bước contract riêng).
