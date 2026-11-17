# Dữ liệu có cấu trúc cho dự án (SEO + GEO)

**Status:** ĐANG THỰC HIỆN (cập nhật 2026-11-06). Code backend + frontend xong ở local, test xanh, **chưa commit, chưa deploy, chưa ghi prod**. Chưa có bài dự án nào được nhập/viết lại. Bài mẫu đầu tiên: Villa Mrs. Thắm (Tân Phú).
**Thay thế:** các quyết định "không thêm cột facts" và cột `headline` của `docs/pseo-projects-plan.md` (xem mục 8).

## 1. Vấn đề

Phần mềm chỉ còn một mục đích: để khách và công cụ AI tìm thấy ELC rồi nhắn Zalo. Mỗi dự án là một **bằng chứng thi công**. Quét 71 dự án trên prod (2026-11-06) cho thấy bằng chứng đó đang nghèo và không đồng nhất:

| Phát hiện | Số liệu |
|---|---|
| `completed_at` rỗng | 71/71 |
| `client_name` rỗng | 71/71 |
| Bảng thông tin gõ tay trong bài | 68/71, **6 cách đặt tên** cho nhãn ngày hoàn thành |
| Địa điểm lẫn tên công trình, quận, tỉnh | 66/71 là chữ tự do |
| Tỉnh theo tên **trước sáp nhập 1/7/2025** | rất nhiều (Bà Rịa - Vũng Tàu, Bình Dương, Long An, Kiên Giang...) |
| Có ghi diện tích / số tầng / thời gian thi công / bảo hành | 2 / 0 / 0 / 2 trên 71 |
| Thiết bị qua sử dụng | 28/71 (đã nằm trong `project_category.condition`, nhưng không hiển thị) |
| Ảnh | trung vị 1 ảnh/bài; 0/191 ảnh có alt |
| Dự án chưa gắn dịch vụ (cạnh tới trang trụ cột) | 17/71 |

ChatGPT đã trích dẫn 3 trang villa của ELC làm nguồn khi được hỏi về điều hòa trung tâm cho biệt thự (2026-11-06). Trang dự án đang nuôi GEO thật, nên dữ liệu phải đúng, đủ và đồng nhất.

## 2. Nguyên tắc

1. **Một nguồn sự thật.** Cột có kiểu là nguồn. Bảng "Thông tin dự án" trên trang **sinh từ cột**, không gõ tay. Chữ tự do chỉ dành cho phần kể.
2. **Không bịa số.** Mọi số là `NULL` khi chưa có hồ sơ. `NULL` không hiển thị, không vào JSON-LD, không bao giờ thành "đang cập nhật".
3. **Chỉ công bố cái đã xác minh.** Chưa có giấy tờ thì không viết "đối tác", "đại lý chính hãng", chứng chỉ, hay số bảo hành chung. Sếp xác nhận: bảo hành và thời gian thi công **tùy từng dự án**, không có số chung.
4. **Dữ liệu cá nhân phải có đồng ý.** Tên chủ đầu tư là cá nhân chỉ hiện khi có `client_consent_at` (Luật 91/2025/QH15, NĐ 356/2025).

## 3. Schema (migration `000011_structured_project_facts`, thêm cột, không phá cái cũ)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `province` | text, default `''` | **Tên hiện hành** trong danh sách 34 đơn vị (từ 1/7/2025) |
| `ward` | text, default `''` | xã/phường hiện hành, tùy chọn (không còn cấp huyện) |
| `completed_precision` | text `day/month/year/unknown`, default `unknown` | đi kèm `completed_at` có sẵn |
| `client_kind` | text `person/business`, nullable | `NULL` coi là `person` |
| `client_consent_at` | timestamptz, nullable | bằng chứng và rút lại được |
| `client_consent_note` | text | ghi chú kênh/ngày xác nhận, chỉ nhân viên thấy |
| `indoor_units`, `floors`, `duration_days`, `warranty_months`, `airflow_m3h` | integer, nullable | `CHECK > 0` |
| `capacity_hp`, `area_m2` | numeric, nullable | `CHECK > 0` |
| `brands` | text[], default `{}` | hãng **thực sự có trong công trình** |
| `is_published` | default đổi thành `false` | chỉ ảnh hưởng SQL INSERT tay |

Không thêm cột cho tình trạng thiết bị: **suy ra** từ `project_category.condition` (toàn mới / toàn cũ / hỗn hợp). Hiển thị công khai thành nhãn (sếp đã đồng ý).
Giữ nguyên `location` cũ làm chữ gốc/lịch sử; không còn hiển thị khi đã có `province`. `project_service` (cạnh tới trụ cột), `project_type`: không đổi.

Danh sách tỉnh nằm ở **tầng ứng dụng** (`modules/project/domain/provinces.ts`), không phải enum DB, vì hành chính còn có thể đổi. Cột "gộp từ" của danh sách lấy từ bản dự thảo Nghị quyết 60-NQ/TW (12/4/2025), tên và mã theo Quyết định 19/2025/QĐ-TTg; chưa đọc được văn bản gốc Nghị quyết 202/2025/QH15.

## 4. Cổng xuất bản

Bắt buộc để **chuyển nháp thành xuất bản** (và khi tạo mới đã xuất bản): loại công trình, ≥1 hệ thống, tỉnh/thành, ngày hoàn thành nhất quán với độ chính xác, ≥1 hãng, đã chọn thiết bị (có tình trạng), số lượng thiết bị, **≥3 ảnh, tất cả có alt**.

- Cổng chỉ chạy ở lần chuyển nháp → xuất bản. **Không chạy khi sửa bài đang xuất bản**: 66/71 bài hiện tại sẽ không qua, chặn sửa thì không backfill được. Với bài đang xuất bản, API trả `publish_gaps` (danh sách còn thiếu) và form admin hiện lên.
- "Chưa rõ ngày" là trạng thái hợp lệ (`completed_at` rỗng + `unknown`); có ngày mà để `unknown` thì phải chọn độ chính xác.
- Số liệu quy mô khác (HP, m³/h, diện tích, tầng, thời gian, bảo hành) **tùy chọn**: dữ liệu thật hiếm, ép bắt buộc chỉ sinh số bịa.
- Gate nằm ở app (`domain.PublishGaps`), không phải `CHECK` DB (sẽ chặn cả việc sửa các bài cũ). SQL chạy tay bỏ qua gate, nên mỗi file SQL của từng bài có câu SELECT "publish gaps" chạy sau cùng.

## 5. Quyền riêng tư và API

Trước đây `GET /projects*` không cần xác thực và trả **mọi cột kể cả bài nháp và `client_name`**. Nay:

- `OptionalAuth` trên các route đọc. Khách (không token / token hỏng / quyền thấp) **luôn** bị ép `is_published=true, include_deleted=false`; đọc bài nháp theo id/slug trả 404.
- Tên khách cá nhân bị làm rỗng cho tới khi có `client_consent_at`; `client_consent_*` không bao giờ ra khỏi server. Doanh nghiệp luôn hiện.
- Nhân viên (token có quyền ghi) thấy đầy đủ cùng `publish_gaps`.
- Frontend tách **action đọc cho admin có token** (`getProjectsAdminAction`, `countProjectsAdminAction`) khỏi action công khai (không token, không `cookies()`, để trang công khai không thành dynamic và không lẫn dữ liệu nhân viên).
- **8 tiêu đề và 7 slug đã ghi tên cá nhân** (vd "Villa Mrs. Thắm (Tân Phú)"). Chưa có đồng ý của khách. Quyết định (2026-11-06): **ẩn danh hóa trong lúc viết lại từng bài**; slug đổi qua trigger `trg_slug_redirect` nên 308 tự sinh bằng module redirect (`docs/redirects.md`). Không có đợt đổi hàng loạt riêng.

## 6. SEO/GEO ở tầng trang

- Khối "Thông tin dự án" (`ProjectFactsBlock`) sinh từ cột, **cùng nhãn cùng thứ tự** ở mọi bài, chỉ hiện khi dự án đã có dữ liệu có kiểu (nên bài còn bảng gõ tay không bị nhân đôi).
- JSON-LD: bỏ `Review` tự khen (không đủ điều kiện rich result, lại lấy tên khách làm tác giả); `areaServed` chỉ từ `province`; thêm `serviceType`, `brand`; thêm node `WebPage` có `dateModified`. Trường rỗng không bao giờ được xuất. Ngày độ chính xác tháng/năm không in thành ngày đầy đủ.
- Ảnh có `role` (trước/trong/sau) và `alt`; `role` đi qua cả Go (`platform/media`), DTO, zod, form (trước đây mọi tầng này sẽ xóa im lặng khóa lạ).

## 7. Quy trình từng bài (do Claude làm, người dùng duyệt)

Dữ liệu luôn đọc từ **prod qua `ssh vps-elc`** (DB local là bản sao cũ, chỉ dùng kiểm migration/test).

1. Đọc bài, ảnh, dịch vụ, thiết bị trên prod. Ghi ra dữ kiện thật.
2. Điền cột có kiểu từ dữ kiện có trong bài; không có thì để `NULL`. Tỉnh cũ → tỉnh hiện hành qua `currentProvinceFor`; chữ gốc giữ ở `location`.
3. Viết lại thân bài theo 4 đề mục cố định: **Yêu cầu / Giải pháp và lý do / Thi công / Kết quả**. Dữ kiện công trình chỉ lấy từ bài gốc; phần "vì sao" là giải thích kỹ thuật chung, ghi rõ là chung. Gỡ bảng gõ tay (thay bằng khối sinh từ cột). Tiêu đề ẩn danh nếu có tên cá nhân.
4. Tag dịch vụ đúng (được nhiều), kiểm tình trạng thiết bị với bài, thêm link nội bộ lên trụ cột.
5. Đưa người dùng bản so sánh trước/sau; được duyệt thì tạo SQL theo khuôn bắt buộc của `docs/pseo-projects-plan.md` phụ lục A: **bảng sao lưu trong DB, một transaction, guard số hàng, kiểm tra trước `commit`, `pg_dump` bảng sao lưu ra VPS**. Người dùng chạy (`!`). Claude không tự ghi prod.
6. Sau chạy: SELECT "publish gaps", kiểm 308 của slug cũ, xóa cache/IndexNow.

Chỗ thiếu dữ liệu (diện tích, thời gian thi công, bảo hành) gom thành một danh sách câu hỏi cho sếp, không chặn việc viết bài.

## 8. Đảo quyết định của plan pSEO cũ

`docs/pseo-projects-plan.md` P2 chủ trương **không** thêm cột `province`, `district`, `brands`..., chỉ một cột `headline`, vì chỉ cần loại công trình + hệ thống + khu vực để sinh tiêu đề. Mục tiêu đó đã thay đổi: dữ liệu có kiểu không còn chỉ để sinh `headline` mà là **bằng chứng thi công để AI và khách trích dẫn** (số lượng, hãng, tình trạng thiết bị, nơi, ngày). Vì vậy các cột trên được thêm.

- **`headline` bị bỏ khỏi phạm vi.** Mỗi bài được viết lại và `title` là `h1`, nên không cần cột thứ hai. Migration `000010` đã dùng cho `drop_tags`; số tiếp theo là `000011`.
- `modules/project/domain/seo.ts` (`buildProjectSeo`) và `seo-proposal.csv` giữ làm công cụ gợi ý/kiểm tra độ dài khi viết tiêu đề và meta từng bài, không còn là một đợt ghi hàng loạt.
- `district` và `venue_name` không có: cấp huyện đã bãi bỏ; `client_name` công khai thay cho tên công trình.

## 9. Triển khai

Thứ tự bắt buộc: **frontend trước, backend sau.** Backend mới ẩn nháp và che tên với mọi request không token; admin cũ không gửi token khi đọc danh sách nên sẽ mất toàn bộ bài nháp nếu backend lên trước. Frontend mới chạy được với backend cũ (`facts` thiếu thì dùng giá trị rỗng).

1. Sao lưu prod: `pg_dump` vào `~/Documents/ELC/db-dumps/` (down migration xóa dữ liệu các cột mới).
2. Deploy `elc-temp` (action admin có token, form, khối facts, JSON-LD).
3. Deploy `elc-go`: `scripts/migrate-all.sh` chạy trước khi thay container (prod đang ở `schema_migrations_project = 10`), áp `000011`.
4. Kiểm: trang admin vẫn thấy nháp; API không token không thấy nháp, `client_name` cá nhân rỗng; JSON-LD một trang dự án.

Đã kiểm local: unit test Go toàn repo, test tích hợp trên Postgres thật (round-trip `numeric`/`text[]`/ảnh `role`, hồi sinh không thừa hưởng dữ liệu cũ, `CHECK`), `vitest` 327 test, typography audit, eslint, typecheck.

## 10. Chưa làm

- Bài mẫu và 70 bài còn lại.
- Gắn dịch vụ cho 17 dự án chưa có; rà tình trạng thiết bị cả 71 bài (2 trong 3 dự án "Daikin LikeNew" đang gắn `new`, hiện nhãn "mới" ở đó là sai).
- Thông tin người phụ trách chuyên môn (chờ người dùng); chứng chỉ (chờ công ty xác minh); đối tác thiết bị (chưa công bố).
- `completed_at` chưa thể xóa về rỗng qua API (con trỏ nil = không đổi); chưa cần cho quy trình hiện tại.
- Menu `PROJECT_GROUPS` còn hardcode; trang loại công trình chưa theo hệ thống. Làm sau khi dữ liệu đã đủ.
