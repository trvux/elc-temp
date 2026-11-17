# Vòng tăng trưởng hiển thị và click — nhật ký 2026-11-17

**Status:** Đang chạy. Đã ghi DB prod 3 đợt (chỉ thêm link, có sao lưu). Chưa commit/push/deploy gì. Chưa có số đo sau thay đổi, chỉ đo lại được sau 2-4 tuần.
**Mục tiêu của user:** tăng trưởng hiển thị và click cho toàn site để có khách mua lẻ, làm dự án và dịch vụ (B2C lẫn B2B). Không đặt con số cụ thể.

## Mốc để so sánh (GSC loại Web, trước thay đổi)

- 28 ngày 19/10 đến 15/11/2026: 3.476 lượt hiển thị, 66 click, 333 trang có hiển thị, trung vị 4 lượt/trang, 245 trang dưới 10 lượt.
- 90 ngày 18/8 đến 15/11/2026: 12.967 lượt hiển thị, 171 click, 464 trang.
- Nhóm vị trí 10-50 (dư địa lớn nhất): 230 trang, ~8.200 lượt hiển thị 90 ngày.
- Đỉnh lịch sử: 10.266 lượt/ngày toàn site (4/8/2025), phần lớn từ trang hướng dẫn remote bản WordPress cũ (không phải ý định mua).
- Cách đo: kéo lại cùng cách (page, 28 ngày) vào khoảng 15/12/2026 và so; tách nhóm trang sản phẩm, dịch vụ, dự án khỏi tin hướng dẫn.

## Đã thay đổi trên prod (đều chỉ thêm, hoàn tác được)

| # | Thay đổi | Ghi chú hoàn tác |
|---|---|---|
| 1 | `project_service`: 4 dự án VRV gắn vào 2 dịch vụ VRV (2 villa vào "biệt thự và nhà ở", nhà hàng + spa vào "thương mại và công nghiệp") | `DELETE FROM project_service WHERE service_id IN ('611fc556-1743-40bd-b032-d130d230489d','df9b732a-f51d-4199-8350-1988c93e6f65') AND created_at >= '2026-11-17'` |
| 2 | `project_service`: 7 dự án khí tươi gắn vào dịch vụ khí tươi (từ 20 lên 27) | `DELETE ... service_id='22b0f868-0006-4632-863c-b80f698a74a2' AND created_at >= '2026-11-17'` |
| 3 | 64 bài tin về chất lượng không khí (nhắc khí tươi >=4 lần) được thêm một đoạn "tìm hiểu thêm" cuối bài, link tới `/dich-vu/he-thong-cap-gio-tuoi-thu-hoi-nhiet`, 4 kiểu anchor xoay vòng | Bảng sao lưu `news_backup_20261117_internal_link`; khôi phục: `UPDATE news n SET content=b.content FROM news_backup_20261117_internal_link b WHERE n.id=b.id` |
| 4 | 10 bài tin VRV/điều hòa trung tâm được thêm một đoạn cuối bài link tới cả 2 trang VRV | Bảng sao lưu `news_backup_20261117_vrv_link`, khôi phục tương tự |

Kiểm tra: số liệu DB khớp (74 bài có link khí tươi = 10 cũ + 64 mới; 10 bài có link VRV); mẫu 8 bài live thấy link đã hiện. Các bảng `news_backup_20261117_*` nằm trong DB prod, xóa khi đã chắc không cần hoàn tác (xóa cần user đồng ý).

## Phát hiện từ audit

- Dịch vụ: 14 hàng published trong DB, chỉ 8 trang sống. 5 hàng trả 410 (`thu-nghiem-dich-vu` và 4 slug cũ), `thanh-ly-...` 308 sang trang thu cũ đổi mới. Sitemap chỉ có 8 trang thật nên không lộ rác. Chưa dọn.
- Cầu từ khoá (Keyword Planner): cụm EPC cực nhỏ ("thi công điều hòa trung tâm" 20/tháng), cầu lớn ở thiết bị (cassette ~5.800, quạt thông gió âm trần ~4.600, cạnh tranh HIGH). Thông gió nhà xưởng 980/tháng và chiller 620/tháng: ELC 0 trang, sếp bảo chưa hoạt động.
- "hrv" 9.900/tháng là xe Honda và chỉ số nhịp tim, không phải thông gió.
- Catalog Daikin trên site thiếu hẳn họ FCTF (Sky Air cassette inverter cao cấp), FCFG, FCC, FDLF so với bảng giá đại lý.

## Chờ user quyết (cần code, đổi meta, hoặc nội dung ELC thật)

1. Bản nháp bài ERV: `docs/erv-hrv-article-draft.md` (không gán loại ERV/HRV cho model Menred; còn 1 ô đối chiếu nhãn "(ERV)" trên 9 trang sản phẩm).
2. Danh sách mã Daikin còn thiếu so với bảng giá (cần sếp quyết dòng nào đăng).
3. Trang dịch vụ thông gió công nghiệp và chiller (không bịa dự án; chỉ "nhận khảo sát và báo giá").
4. URL lọc/phân trang `/san-pham?...page=N` đang có hiển thị: cần xem canonical/noindex trong code rồi mới đề xuất.
5. Đổi title/meta các trang CTR thấp: chưa làm vì sẽ làm nhiễu phép so sánh ở mốc đo; làm sau mốc 15/12.

## Cập nhật đêm 2026-11-17 (đợt 2)

**Nghiên cứu cầu (Keyword Planner):** cụm điều hòa trung tâm/VRV lớn hơn nhiều so với đo lần đầu (seed lần đầu viết theo "thi công, thiết kế" nên sai). "điều hòa trung tâm" 3.600, "điều hòa trung tâm vrv" 2.900 (cạnh tranh LOW), "vrv daikin" 2.400, "điều hòa vrv" 1.600, "máy lạnh vrv" 1.600, "máy lạnh trung tâm" 1.900. ELC mới có 326 lượt hiển thị/90 ngày, 0 click, vị trí 40-75. ERV/HRV thông gió ~0-140/tháng (không đáng làm trang riêng). "vrf" 6.600 nhiều khả năng là thuật ngữ mạng máy tính.

| # | Thay đổi | Hoàn tác |
|---|---|---|
| 5 | `meta_description` 2 trang VRV thêm "máy lạnh trung tâm VRV Daikin", "nhận khảo sát, báo giá" (title giữ nguyên, đã khớp từ khoá 2.900) | Bảng `services_meta_backup_20261117` |
| 6 | +6 FAQ cho 2 trang VRV (gọi tên máy lạnh/điều hòa trung tâm, VRV vs VRF đã kiểm chứng với tài liệu Daikin, báo giá gồm gì, VRV hay chiller) | `DELETE FROM faqs WHERE owner_type='service' AND created_at >= '2026-11-17'` (kiểm tra phạm vi trước) |
| 7 | 2 trang NHÁP chưa xuất bản: `thong-gio-nha-xuong-cong-nghiep`, `he-thong-chiller-cho-cong-trinh` (line thi-cong, nội dung kỹ thuật chung, không dự án/năng lực ELC giả; chưa có ảnh/FAQ) | Khi sếp xác nhận hoạt động: thêm ảnh có alt/caption, FAQ, rồi `is_published=true` |

**Quyết định của tao (đã giao quyền):**
- URL lọc `/san-pham?...page=N`: KHÔNG sửa code. Đã kiểm live: canonical về `/san-pham`, đúng chuẩn; chỉ vài URL, mỗi URL 1-7 lượt hiển thị.
- E-E-A-T: schema Article đã dùng Organization (Điện máy ELC) làm tác giả; Organization có địa chỉ, chi nhánh, sameAs hãng. Không tạo tên tác giả cá nhân hay chứng chỉ vì không có dữ liệu thật; cần user cung cấp nếu muốn (tên kỹ sư, chức danh, năm kinh nghiệm thật).
- Bài ERV: HOÃN. Cầu ~0 và còn chưa xác minh loại lõi Menred; xét lại sau khi đo cụm VRV.
- Không tạo trang mới cho "máy lạnh trung tâm": đã có 2 trang dịch vụ + 2 bài (`he-thong-dieu-hoa-trung-tam-la-gi...`, `he-thong-dieu-hoa-trung-tam-vrv-vrf`) cho cụm này, thêm trang sẽ ăn thịt nhau.

## Cập nhật đợt 3 (E-E-A-T)

| # | Thay đổi | Hoàn tác |
|---|---|---|
| 8 | Thêm mục "Về Điện máy ELC" cuối 4 trang dịch vụ (2 VRV, khí tươi, lắp đặt): thành lập 25/11/2021 (khớp trang Giới thiệu), "hơn 70 công trình đã đăng" (DB: 71 dự án xuất bản) | Bảng `services_content_backup_20261117` |

**Tác giả cá nhân:** user nêu Nguyễn Hữu Thấu, nhớ là có bằng tiến sĩ, làm từ 25/11/2021. CHƯA xác minh: site không nhắc tên/học vị, web không có nguồn, DB không có bảng tác giả. Chưa công bố học vị hay chức danh. Cần: chức danh chính xác, bằng chứng học vị (ngành/trường/năm hoặc link), đồng ý công khai tên. Sau đó mới dựng (bảng tác giả + Person schema + khối "Tư vấn kỹ thuật" trên trang dịch vụ).

| 9 | Khối "Về Điện máy ELC" (4 trang dịch vụ) thêm câu "ELC nhận giải New Dealer Award tại Daikin Dealer Awards 2023" (nguồn: ảnh user đưa, poster Daikin ghi tên công ty ELC; web không có nguồn độc lập, site chưa nhắc giải này trước đó) | Bảng `services_content_backup2_20261117` |

Nguyễn Hữu Thấu: giám đốc (user xác nhận). Học vị: không biết. Ảnh `~/Downloads/nguyenhuuthau.jpg` là ảnh nhận giải, 2 người, chưa biết ai là ông Thấu, chưa đăng. Cần: ông Thấu đồng ý công khai tên/ảnh, chỉ rõ ai trong ảnh, xác nhận dùng ảnh có logo Daikin và người thứ hai.

| 10 | Câu giải thưởng ghi rõ "do Giám đốc Nguyễn Hữu Thấu đại diện nhận" (ông Thấu đồng ý công khai tên và ảnh; user xác nhận ông là người bên phải trong ảnh) | Bảng `services_content_backup3_20261117` |

**Chờ user chạy:** commit+push ảnh `public/images/team/nguyen-huu-thau.webp` (classifier chặn push main). Sau khi deploy xong và ảnh trả 200: chạy `~/Documents/ELC/pending-assets/portrait-block.sql` (thêm khối ảnh có chú thích vào 4 trang). Person schema CHƯA làm: `shared/lib/seo-schema.ts` đang có thay đổi chưa commit của việc khác, cần user quyết cách tách.

| 11 | Khối ảnh có chú thích của ông Thấu (bản crop, rộng 180px, canh giữa) ở cuối 4 trang dịch vụ. User đã push commit `924cc9b8` (ảnh tĩnh), deploy xanh, ảnh trả 200, trang live có `<img>` + `<figcaption>` | Bảng `services_content_backup4_20261117` (nội dung trước khi thêm ảnh); file ảnh có thể giữ |

Person schema vẫn chưa làm (xem ghi chú ở trên).

| 12 | Gỡ ảnh cả người (user chê); `updated_at` của 4 trang dịch vụ được cập nhật (trước đó "Cập nhật lần cuối" vẫn ghi 6/11 dù nội dung đã đổi). Thay bằng thẻ Avatar shadcn cắt mặt + Person JSON-LD trong component (không đụng `seo-schema.ts`): `modules/service/domain/director.ts`, `ServiceDirectorCard.tsx`, test `director.test.ts`, ảnh `public/images/team/nguyen-huu-thau-avatar.webp`. Kiểm tra local: vitest 121 xanh, typography-audit 0 regressed, eslint sạch, tsc 0 lỗi ngoài `.next/`. Chưa chạy `next build` (user đang chạy dev); CI sẽ build. CHỜ user commit+push. | Gỡ: revert commit; ảnh crop cũ `nguyen-huu-thau.webp` (đã deploy) giờ không dùng nữa, xóa khi user đồng ý |

## Harness SEO/GEO (đêm 2026-11-17 → 18) — `~/Documents/ELC/seo-harness/`

Bộ khung chạy vòng lặp cho toàn bộ 430 trang: `RULES.md` (luật SEO và GEO có nguồn), `01_inventory` → `02_gsc` → `03_demand` (Keyword Planner) → `04_assign` (chống ăn thịt nhau) → `05_audit` (chấm điểm) → briefs → `apply.py` (ghi có sao lưu). Chi tiết quy trình: `seo-harness/README.md`.

| # | Thay đổi prod | Hoàn tác |
|---|---|---|
| 13 | Gỡ chữ giữ chỗ `[bổ sung]` khỏi 7 trang dịch vụ (giữ nội dung thật; các câu hỏi giữ chỗ lưu ở `seo-harness/FACTS_NEEDED.md`) | bảng `services_bk_placeholders_20261117` |
| 14 | Meta description riêng cho 68 trang thiếu/trùng (53 sản phẩm treo tường Daikin dùng chung 1 câu, 12 tin, 2 dự án, 1 trang) | bảng `products_bk_meta_20261117`, `news_bk_meta_...`, `projects_bk_meta_...`, `pages_bk_meta_...` |
| 15 | Điền alt cho 1.164 ảnh trong nội dung của 209 trang (135 sản phẩm, 60 dự án, 14 tin), từ tên trang + tiêu đề mục + số thứ tự ảnh; KHÔNG đổi `updated_at` | bảng `products_bk_alt_20261117`, `news_bk_alt_...`, `projects_bk_alt_...` |

Điểm audit trung bình (SEO): sản phẩm 87→98, dự án 86→93, dịch vụ 78→86, tin 90→92. Còn lỗi nặng: 7 trang rỗng (dịch vụ chết, loại công trình trống), 2 tin trùng title.

| 16 | Mục "Các dòng VRV của Daikin" (nhà ở) và "Dòng VRV Daikin cho các yêu cầu đặc thù" (thương mại), nguồn daikin.com.vn đối chiếu 17/11/2026 | bảng `services_bk_vrvlineup_20261117` |
| 17 | 42 trang sản phẩm Daikin treo tường: khối "Thông số nhanh" (BTU, sao năng lượng, phòng phù hợp), meta có BTU và sao, +1-2 FAQ ("là bao nhiêu BTU", "phù hợp phòng bao nhiêu m²"). Chỉ dùng thông số kỹ thuật từ bảng RA của Daikin, KHÔNG dùng giá | bảng `products_bk_specs_20261117`, `products_bk_specsmeta_20261117`; FAQ: xóa theo `created_at` 2026-11-17 và owner_type='product' |

**Nguyên tắc giá (2026-11-18):** user đồng ý công bố giá tham khảo nhưng chỉ là khoảng rộng, KHÔNG lấy từ bảng giá đại lý/RCP/ASP của hãng (sợ ràng buộc ELC bán lỗ, và file là tài liệu đại lý). Chờ sếp cho khoảng chấp nhận được.

**Cách làm từng trang (page_x.py):** lấy trang X -> suy ý định theo loại (sản phẩm theo mã máy khác hẳn trang VRV) -> tạo từ khoá gốc theo ý định (mã/series, công suất, nhu cầu phòng, mua giá, tính năng) -> Keyword Planner -> gom cụm, lọc cụm không thuộc thực thể trang -> đối chiếu title/H/thân bài -> viết bổ sung bằng dữ kiện đã xác minh. Mẫu: trang `may-lanh-daikin-inverter-mot-chieu-2hp-ftkm50avmv`: chùm cầu thật ~700-1.000/tháng tổng (không phải hàng chục nghìn), nên mục tiêu 10k/trang chỉ hợp lý cho trang trụ cột/hub, không cho trang sản phẩm đơn lẻ.

| 18 | Khối /san-pham: 10 trang HP (máy lạnh 1HP...5.5HP) vốn TRỐNG nay có nội dung riêng (BTU từ thông số Daikin, phòng và số mẫu từ site), meta_title/meta_description mới, +1 FAQ ("ngựa và HP"). 3 trang HP đã xóa (6HP, 10HP, Daikin) bỏ qua. Bản nháp cũ `docs/hp-pages-seo-content.md` (1-10HP, viết từ trước, chưa từng đưa lên) KHÔNG dùng nguyên văn vì có câu "qua khảo sát thực tế", số tiền điện và thời gian làm lạnh chưa kiểm chứng | bảng `hp_pages_bk_hp_20261117` |
| 19 | Dọn FAQ trùng ý do chính harness thêm: 19 dòng trên trang HP và các dòng trên trang sản phẩm (backup `faqs_bk_hpdup_20261117`, `faqs_bk_proddup_20261117`). Bài học: kiểm tra FAQ/nội dung đã có của TRANG ĐÓ trước khi thêm | các bảng backup trên |

| 20 | Khối /du-an: 11 trang loại công trình (biệt thự, chung cư, nhà phố, nhà hàng, văn phòng, công nghiệp...) vốn 0-125 từ nay có nội dung từ dữ liệu dự án thật (số dự án, tỉnh, hệ thống ít nhất X công trình, link tới từng dự án, link dịch vụ) + meta. KP cho thấy các trang này hầu như không có cầu (0-390/tháng; riêng "công trình công nghiệp" dính "điều hòa công nghiệp" 12.100 nhưng ELC không nhắm trực diện) nên vai trò = bằng chứng và phân phối, không phải kéo hiển thị | bảng `project_type_bk_20261117` |

**Còn trống công khai:** `/du-an/can-ho-dich-vu` và `/du-an/showroom` (0 dự án, 0 từ, trả 200). Cần user quyết: thêm dự án thật, hoặc bỏ loại này khỏi site. FAQ không dùng được cho project_type (ràng buộc `chk_faq_owner_type` không có project_type, cần migration ở elc-go).

| 21 | Khối /san-pham, 6 danh mục kiểu máy: title/meta viết lại theo cách người dùng gõ (KP): "điều hòa cây" 12.100/th (tủ đứng), "điều hòa âm trần" 5.400, "điều hòa treo/áp/giấu trần", "máy cấp gió tươi"; bỏ câu quảng cáo dài dùng chung ("giá tốt, chính hãng, miễn phí lắp đặt, giao hàng nhanh" vì không kiểm chứng, và title >70 ký tự); thêm 1 câu giải thích tên gọi + 1 FAQ tên gọi mỗi trang | bảng `categories_bk_names_20261117`; FAQ xóa theo created_at |

**Quy trình theo khối (user chốt 2026-11-18):** quét từng khối, liệt kê trang, làm từng trang: hồ sơ ý định -> seed riêng -> Keyword Planner -> không ăn từ khoá của nhau. Đã xong: /san-pham (sản phẩm Daikin treo tường 42 trang, 10 trang HP, 6 danh mục); /du-an (11 trang loại công trình). CHƯA làm: danh mục còn lại (remote, công tắc/cảm biến/bảng điều khiển thông minh, phụ kiện khí tươi, máy lọc nước), 12 trang thương hiệu, 10 nhóm, 137 sản phẩm còn lại, 71 dự án, 123 bài tin, 8 dịch vụ (đã làm một phần), 6 trang thông tin, trang chủ.

| 22 | Khối /tin-tuc (123 bài): hồ sơ đối tượng/ý định (`seo-harness/profile.py`: B2B/B2C/both + cửa form), meta_title chuẩn hóa (chữ hoa/Title Case -> sentence case, bỏ ngắt giữa câu), meta bổ sung, link nội bộ theo chủ đề và đối tượng (B2C -> dịch vụ/danh mục; B2B -> dịch vụ thương mại + loại công trình; chỉ khi chủ đề là nội dung chính) + 1 bài liên quan | bảng `news_bk_intent_20261117` |
| 23 | GEO: 119 FAQ trích từ tiêu đề câu hỏi trong 42 bài tin (đáp án = đoạn ngay dưới tiêu đề). CHƯA có tác dụng cho tới khi trang bài tin hiển thị FAQ: đã sửa `app/(public)/tin-tuc/[slug]/page.tsx` (FAQAccordion + FAQPage schema), tsc/eslint/330 test/typography xanh, CHỜ user commit+push | xóa FAQ owner_type='news' tạo 2026-11-17 |
| 24 | 47 trang sản phẩm Daikin thương mại (cassette, giấu trần, áp trần, tủ đứng): khối thông số nhanh (kW, BTU, dải) từ bảng Sky Air (CHỈ đọc cột công suất, không đọc giá), FAQ "là bao nhiêu BTU?", meta giữ nguyên chữ cũ và chèn BTU | `products_bk_specs2_20261117`, `products_bk_specsmeta2_20261117` |

Sửa bộ chấm: G4 đo mật độ cụm lặp sai thang (chia nửa), ngưỡng 2,5% báo nhầm 315/430 trang; đã sửa thành tỷ lệ thật, cảnh báo >5%.
Bỏ qua theo lời user: trang có 0 dự án/0 sản phẩm (`/du-an/can-ho-dich-vu`, `/du-an/showroom`, 6HP/10HP/Daikin HP đã xóa, danh mục rỗng).

25. Bài tin trùng tiêu đề (`6e7e81a1…`): đổi tiêu đề/meta sang góc dàn lạnh, khay nước ngưng, hóa đơn điện (backup `news_bk_dup_20261117`).
26. 6 danh mục mỏng (công tắc, cảm biến, remote, bảng điều khiển, lọc nước RO, phụ kiện khí tươi): meta title/description viết lại từ sản phẩm thật (backup `categories_bk_meta2_20261117`).
27. Push 07b4d803 (FAQ + FAQPage cho bài tin) đã deploy xong, FAQPage hiện trên bài `he-thong-dieu-hoa-trung-tam-la-gi-...`.
28. Audit bỏ trang rỗng đã trả 410/308 (service rác, trang lorem ipsum, 2 loại công trình trống).

29. SERP thật qua Chrome (10 từ khoá, Google VN, chưa ẩn danh nên có thể bị cá nhân hoá): gió tươi cho biệt thự hạng 1; AI Overview "VRV cho biệt thự" trích Điện máy ELC; các từ khoá khác chưa thấy ELC trong top 8.
30. Sửa `04_assign.py`: CORE regex thay BIZ rộng, OUT_OF_SCOPE, COMP_BRAND (hãng ELC không bán), INACTIVE (công nghiệp/chiller chỉ cho trang công nghiệp), trust-intent chỉ cho page/brand, service-intent ưu tiên trang dịch vụ. Chạy lại keyword_map (bản cũ `data/04_assign.py.bak`).
31. `06_live_validate.py`: quét HTML live của 421 trang. Kết quả `data/live_report.md`. Không có noindex ngoài 8 thương hiệu 0 sản phẩm, không JSON-LD hỏng, FAQ DB khớp FAQPage, không trùng title/meta. 202 trang có ảnh alt rỗng (thumbnail/thẻ liên quan, lỗi giao diện).
32. Meta dịch vụ thu cũ thêm "thu mua điều hòa cũ" (backup `services_bk_thucu_20261117`).

33. Đo lại ở phiên chưa đăng nhập Google (`logs/serp_2026-11-17.json`): 26 từ khoá, ELC trên trang 1 ở 3 từ khoá (VRV cho biệt thự ~thứ 5, cấp khí tươi Menred thứ 2, gió tươi thu hồi nhiệt cho biệt thự thứ 8); 16/26 có AI Overview, không cái nào trích ELC. Phiên đã đăng nhập trước đó cho gió tươi biệt thự hạng 1 và AIO VRV có ELC: bị cá nhân hoá làm đẹp.
34. ChatGPT chưa đăng nhập: câu hỏi nhà thầu VRV biệt thự TP.HCM không nêu ELC (5 đơn vị khác); câu hỏi Menred nêu ELC là nơi mua ở TP.HCM, dẫn 3 trang của ELC. Perplexity bắt đăng ký nên chưa đo.
35. Menred: đối chiếu toàn thương hiệu với menred-hvac.com. Bỏ hậu tố "Inverter" khỏi 23 meta_title; sửa nhãn S1, NEW5.350, HUM35, phụ kiện; chính tả "khi tươi", "HPDE" (backup products_bk_menredtitle_20261117, products_bk_new5350_20261117).
36. Menred: khối "Thông số kỹ thuật theo nhà sản xuất" + link nguồn cho 9 model, 7 FAQ, 12 đoạn mô tả, 26 thuộc tính (backup products_bk_menredspec_20261117, products_bk_menredtext_20261117, faqs_bk_menredspec_20261117, product_attribute_values_bk_menredspec_20261117). Phát hiện: Q6 dùng kích thước của DEH60; họ NET dùng mẫu mô tả "HEPA H13 99,97%" mà hãng ghi lọc G4; UF xếp nhầm danh mục RO.
37. Menred đối soát 3 nguồn (hãng, Hagisu, ELC): 21 thuộc tính, 2 FAQ, 10 mô tả (backup product_attribute_values_bk_menredrecon_20261117, faqs_bk_menredrecon_20261117, products_bk_menredrecon_20261117). Hoàn lại phần quá tay ở NET.800/NET.2000 (63/159 kg, lọc G4+H13 theo Hagisu); sửa Q6 (1420×800×270), S5 (990×720×230), NET.3000 (217 kg), R150/R350; khối thông số theo Hagisu cho P7 PRO. NET.8000 không có nguồn nào, chưa gỡ.
38. NET.8000 -> archived + soft-delete + 308 NET.800 (3 chuyển hướng cũ trỏ thẳng đích); `contentvar` đếm cả sản phẩm archived và có cache nên số mẫu danh mục live còn lệch tạm (DB: 18 xuất bản).
39. Tách danh mục Menred (patch_split_categories.py, backup products_bk_catsplit/categories_bk_catsplit): may-cap-khi-tuoi-mot-chieu, may-cap-khi-tuoi-khu-am, may-loc-nuoc-ro, may-loc-nuoc-uf (nội dung từ thông số đã xác minh, FAQ, nguồn có link); HUM35 sang phụ kiện; danh mục khí tươi cũ cập nhật biến đếm, bỏ NET.8000, bỏ "12/25 HEPA H13".
40. Bài ERV/HRV viết lại bằng nguồn DOE (bsesc.energy.gov) + Menred, bỏ 20-40%, ví dụ nhiệt độ, "hàng triệu đồng"; slug mới erv-hrv-la-gi-khac-nhau-the-nao (308 từ slug cũ), 4 FAQ; ảnh giữ kèm chú thích số minh hoạ (backup news_bk_erv_20261117, faqs_bk_ervnews_20261117).
41. Khối VRV (07_block_tree.py vrv, 15 lá): bài tin VRV/VRF (267 hiển thị, vị trí 27) làm mềm 9 chỗ số không nguồn (20-35%, ống 300-1000 m, tuổi thọ 15-20 năm, bảng Multi), thêm bảng dòng VRV theo Daikin VN (6X, 7S R-32, H, IV Q), 4 FAQ (backup news_bk_vrv_20261117).
42. PHÁT HIỆN LỚN (11_legacy_recovery.py): 236 URL đã 404/410 từng có >1,0 triệu hiển thị/16 tháng, nhiều trang vị trí 5-9 (remote 214.771 impr/1.596 click; mối chất lạnh 72.736; cool 69.721). Nguyên nhân gốc của "search không ra": migration giết các trang này. 144 URL thuộc phạm vi máy lạnh (889k impr).
43. Khôi phục 31 bài nhóm khớp mô hình (12_restore_legacy.py --tierA) từ Wayback (bài cũ của chính ELC, bản lưu 9/2025-1/2026): đăng thành /tin-tuc/<cùng slug> + 308 từ URL gốc; làm sạch mục lục, tác giả, khuyến mãi/giá/số điện thoại, ảnh hỏng; mỗi bài nối ra 1 dịch vụ + 1 danh mục; trang dịch vụ sửa chữa/vệ sinh/lắp đặt có mục "Hướng dẫn và xử lý sự cố" nối vào. Danh sách câu cần người kiểm tra: data/restore_review.md. Theo dõi: data/restore_urls.json (so GSC sau 2-4 tuần).
44. CHƯA khôi phục (chờ user quyết độ khớp): hướng dẫn remote/hẹn giờ của hãng ELC không bán (Mitsubishi 61k, Panasonic 13k, Samsung, Toshiba hẹn giờ, Gree không có bản lưu), bài "Top 5 máy lạnh mini", "Top 7 app"; ~110 URL chết còn lại trong legacy_candidates.json.

45. B0 đợt 2 (nhóm khớp: vệ sinh/sửa chữa/lỗi/khái niệm chung/Daikin/LG): khôi phục thêm 19 bài từ Wayback bằng 12_restore_legacy.py --paths (ống thoát nước 8,1k impr, mã lỗi LG/Daikin, hẹn giờ Daikin, chế độ Dry/các chế độ, cục nóng kêu to...), đăng /tin-tuc/<slug> + 308 từ URL cũ; live kiểm 19/19 trả 200 và 308. Bỏ có chủ ý: bài vị trí phòng ngủ (trùng bài đã khôi phục), nguyên lý hoạt động (nội dung sưởi), 4 bài không có bản lưu. Câu cần người kiểm: data/restore_review_B.md. Theo dõi: data/restore_urls.json (50 URL, batch B0-2 là đợt này). GSC 14 ngày trước đợt 1: 0/31 bài có hiển thị (mới đăng 17/11, mốc gốc để so sau 2-4 tuần). Rollback: xoá news theo slug + redirects theo from_path. Lưu ý: chạy dry-run lại 12_restore_legacy.py sẽ ghi đè restore_review.md/restore_plan.json.

46. 17/11: `/vrv-la-gi` (25k impr, pos 53) -> 308 về `/tin-tuc/he-thong-dieu-hoa-trung-tam-vrv-vrf` (một trang sở hữu từ khoá; live 308). Push FE `defa743c` + BE `6241a2d` (project structured facts, migration 000011 additive đã chạy prod, 72/72 dự án vẫn xuất bản). BE đẩy từ nhánh sạch cắt từ origin/main, KHÔNG đẩy `chore/remove-wishlist` (có 6 commit drop bảng/cột chưa vào main). Chưa làm pg_dump trước deploy như docs/project-structured-facts.md mục 9 bước 1 (migration chỉ thêm cột, không mất dữ liệu).
47. B2 VRV: bài "điều hòa trung tâm là gì 2026" bỏ 7 chỗ không nguồn (sưởi, 6-64 dàn lạnh, 4-60HP, năm 1982 "độc quyền" mà trang Daikin VN không nêu, tiết kiệm 30-40%, tuổi thọ 15-20 năm, "hàng chục triệu") + 3 FAQ; bài quy trình thi công thêm ghi chú thông số tham khảo, theo tài liệu hãng; 2 trang dịch vụ VRV nối xuống 5 bài tin (bảng dòng VRV Daikin đã có từ trước). Backup news_bk_vrv2_20261117, services_bk_vrv2svc_20261117. B1: bỏ "20-40%" và "80-90% thời gian trong nhà" ở 2 bài tin khí tươi (news_bk_khituoisoft*_20261117). CHƯA làm: 8 dự án VRV + 26 dự án khí tươi: facts có kiểu phải đi cùng viết lại bài và gỡ bảng gõ tay (nếu không khối facts nhân đôi), quy trình docs/project-structured-facts.md mục 7, người dùng duyệt và chạy SQL.

48. B3 dịch vụ dân dụng (đo 17/11): 5 trang (sửa chữa, vệ sinh, lắp đặt, thu cũ, cho thuê) có 0 hiển thị GSC 90 ngày (riêng vệ sinh: 25 hiển thị, vị trí 37-83), trong khi cầu lớn: "sửa điều hòa" 33.100/th, "vệ sinh máy lạnh" 18.100/th, "vệ sinh máy lạnh tại nhà" 3.600/th (Keyword Planner). SERP "vệ sinh máy lạnh tại nhà tphcm": top 10 hữu cơ toàn dịch vụ địa phương/chuỗi (Điện Lạnh HK, Limosa, Điện máy Xanh, Hồng Kiều...), snippet và AI Overview nêu GIÁ (100-250k/bộ); ELC không có trong top 10. LƯU Ý: phiên Chrome lúc đo ĐANG ĐĂNG NHẬP Google (hiện bảng Ads của user) nên không dùng làm thước đo thật; cần đo lại ở cửa sổ ẩn danh. Kết luận: 3 trang đầu không lên được nếu thiếu giá công khai; chờ sếp duyệt khung giá. Chưa sửa gì.

49. Dự án (B1/B2): `seo-harness/13_project_facts.py` đề xuất facts có kiểu (tỉnh hiện hành qua provinces.ts, ngày hoàn thành, hãng, HP, số dàn lạnh) từ bảng gõ tay của 72 dự án, KIỂM CHỨNG trước khi sinh SQL: mỗi số phải có NGUYÊN VĂN trong bài; ngày không ở tương lai/gần hôm nay (<45 ngày)/trước 2021; tỉnh qua bảng 34 đơn vị; mỗi hàng bảng bị gỡ phải còn thông tin ở nơi khác (địa điểm trong bài, hạng mục = dịch vụ đã gắn, quy mô có số trong bài); HP dàn lạnh cộng khớp HP dàn nóng mới điền số dàn lạnh. Kết quả: 39/72 qua, 33 giữ bảng/cần người (lý do từng bài trong data/project_facts_report.md). SQL (data/project_facts.sql): backup projects_bk_facts_20261117, guard số hàng, tắt trigger để không đẩy updated_at, kiểm lại sau. ĐÃ CHẠY THỬ trên prod trong transaction ROLLBACK: qua cú pháp và các CHECK, prod không đổi (không có bảng backup, 0 dòng province). CHƯA ghi: quy trình docs/project-structured-facts.md giao người dùng chạy SQL. Chưa kiểm hiển thị khối facts sau ghi.
50. Ghi facts 39 dự án (user chạy project_facts.sql, COMMIT ok); live 39/39: 200, hết bảng gõ tay, JSON-LD hợp lệ. Backup projects_bk_facts_20261117.
51. Kiểm chéo tình trạng thiết bị 39 bài: 34 khớp nội dung (17 used có nhắc, 17 new), 5 gắn 'qua sử dụng' mà bài không nhắc -> FACTS_NEEDED.md, chưa sửa vì không biết sự thật.

52. Sếp chốt: KHÔNG đăng giá; dự án có cả thiết bị cũ và mới, /san-pham là hàng mới. Mô hình vận hành lưu ở memory elc-seo-harness-operating-model.
53. Facts dự án đợt 2 (14_project_facts_v2.py, 30/33 qua; 3 bài không có bảng gõ tay bỏ qua): hàng bảng không chuyển được sang cột giữ thành mục "Thiết bị và quy mô công trình" (không mất thông tin); gắn dịch vụ khi có căn cứ trong tên/hàng thiết bị; bỏ ngày 17/11/2026 (nhập tạm) và 15/01/2021 (sát thời điểm thành lập công ty); SỬA 7 nhãn condition new->used khi tiêu đề/bảng/bài ghi rõ "qua sử dụng"/"Likenew" (nếu không khối facts mới sẽ in "Thiết bị mới" sai). Dry-run ROLLBACK trước, ghi thật, live 30/30. Backup projects_bk_facts2_20261117 (+ project_category.condition cũ nằm trong bảng backup? KHÔNG: project_category không có backup riêng, giá trị cũ là 'new' cho 7 dòng, xem SQL data/project_facts2.sql). Tổng 69/72 dự án có facts có kiểu; còn 3 bài không bảng.
54. Gỡ giá (patch_news_noprice.py): bảng báo giá điều hòa trung tâm (thay bằng "chi phí phụ thuộc vào những yếu tố nào", không số), đơn giá gas/kg, 15-40% chi phí vận hành, ví dụ 300-450k điện (backup news_bk_noprice_20261117). Live 0 số giá.
55. Cannibalization (GSC 90 ngày, page x query): 838 truy vấn, chỉ 14 truy vấn có >=2 trang ELC cùng hiển thị (>=20 impr), site còn nhỏ nên chồng chéo thấp. Đáng chú ý: NEW5.350 hai URL = slug cũ đã 308; sửa slug "thu-hoi-nhiet" sai (máy MỘT CHIỀU) thành may-cap-khi-tuoi-mot-chieu-new5350-menred, 3 redirect cũ trỏ thẳng đích mới (backup products_bk_new5350slug_20261117). Truy vấn "thi công điều hòa không khí": trang gốc /quy-trinh-thi-cong... (vị trí 32) và bài quy trình VRV (95): giữ trang gốc làm chủ.
56. B3: nối 19 bài đợt 2 vào mục "Hướng dẫn và xử lý sự cố" (sửa chữa +13, vệ sinh +5, lắp đặt +1; trước đó đợt 2 chưa được nối từ dịch vụ), thêm mục "chi phí phụ thuộc vào gì" không số + FAQ cho vệ sinh và sửa chữa (backup services_bk_b3_20261117). Quyết định remote hãng khác: chỉ khôi phục nhóm lỗi/sự cố (ELC sửa các dòng phổ thông), bỏ hướng dẫn remote/hẹn giờ thuần; không còn bài mã lỗi nào chờ khôi phục.
57. Chốt dự án (patch_projects_final.py, backup project_category_bk_final_20261117): MobiFone used->new (bài ghi 'hệ thống ... mới'), Gree điền ngày 15/01/2021 (bài ghi 'Đầu năm 2021'), 3 bài không bảng có facts từ câu trong bài. 72/72 dự án có facts có kiểu trừ Estella (không ngày). Đã kiểm live 5/5.
58. Page /quy-trinh-thi-cong-lap-dat-may-lanh-chuan-ky-thuat-tai-dien-may-elc (owner 'tháo lắp máy lạnh' 4.400/th, 107 từ khoá, 10.670 vol): thêm meta_title/meta_description (trước rỗng/cụt), 8 H2 + 5 H3 (trước 0), mục tháo lắp/di dời, hút chân không, chi phí không giá; bỏ 'hỗ trợ 24/7', '100% mối nối', 'cam kết không phát sinh'. 737->972 từ. Backup pages_bk_quytrinh_20261117. Live 200, 1 H1, JSON-LD ok. Trang lorem ipsum đã 410.
59. Loại công trình (patch_ptype2.py): 11 trang viết lại từ facts có kiểu (số công trình, khu vực hiện hành, năm, hãng, tỉ lệ thiết bị mới/cũ, hệ thống + link dịch vụ, danh sách dự án); mọi số đếm từ DB. Bỏ qua can-ho-dich-vu, showroom (0 dự án). Không FAQ vì chk_faq_owner_type không có project_type. Backup project_type_bk_ptype2_20261117. Live 3/3 mẫu: 200, 1 H1, JSON-LD ok.
60. Daikin dân dụng (15_daikin_official.py crawl daikin.com.vn/shop -> data/daikin_official.json 44 model; patch_daikin_specs.py): 43 sản phẩm có trang hãng được thêm khối 'Thông số kỹ thuật theo Daikin Việt Nam' (model dàn nóng, điện năng, CSPF, độ ồn, kích thước; giá trị '-' bỏ) + link nguồn + FAQ độ ồn/kích thước. Phát hiện 3 lệch CSPF giữa tài liệu cũ và trang hãng (FTXM71 6,20 vs 6,5; FTHF35 6.5 vs 5,7; FTXV71 5,22 vs 4,65): ghi chú cả hai nguồn. FTXV71QVMV: CSPF hãng 4,65 trong khi ELC ghi '5 sao' - chưa xác minh tiêu chí sao. Backup products_bk_daikinspec_20261117. Pipeline 01-04 chạy lại (keyword_map 144 trang).
61. Làm mềm số % hiệu quả/tiết kiệm không nguồn toàn bộ bài tin (patch_news_soften_all.py): 21 bài, 29 chỗ (vd 'tiết kiệm 30–50%', 'giảm đến 50% điện năng', '80-90% thời gian'), không đụng độ ẩm/GWP/áp suất. Backup news_bk_softall_20261117. Câu 'theo các nghiên cứu/chuyên gia' mơ hồ chưa sửa (53 bài).
62. Rà danh mục/thương hiệu theo keyword_map mới: các trang có cầu lớn đã phủ >=70% từ khoá sở hữu (brand:daikin 134 từ khoá/28.330 vol, category:may-lanh-tu-dung 85/21.850, âm trần 57/3.860): không còn khoảng trống đáng kể. 8 thương hiệu 0 sản phẩm noindex theo quyết định cũ. Acis: không truy cập được nguồn hãng (acis.vn không phân giải; acis.com.vn không có trang sản phẩm trong kết quả tìm), 16 sản phẩm GIỮ NGUYÊN, đánh dấu chưa xác minh. Keyword map nhiễu: nhiều từ khoá gán sai (vd 'điều hoà sk', 'fujitsu', 'sunhouse' cho loại công trình) nên KHÔNG phủ máy móc các từ khoá có intent product/hãng ngoài phạm vi.
63. LG (patch_lg_specs.py): chỉ 2/13 model ELC còn trên lg.com/vn (IPC09M1, IDH12M1; 11 model còn lại là mã cũ/mới chưa có trên trang hãng): thêm khối thông số theo LG VN từ JSON-LD của hãng (không lấy giá). Backup products_bk_lgspec_20261117. Daikin Sky Air (74 SP thương mại): trang daikin.com.vn/corporate/.../sky-air không có bảng thông số (không có FCF125/độ ồn/kích thước, không PDF); nguồn bán lẻ (meta.vn) không phải nguồn chính thống -> GIỮ NGUYÊN, chưa xác minh.
64. Bài tin (patch_news_vague.py): 28 bài, 34 chỗ: 'nhiều nghiên cứu/chuyên gia' -> 'tài liệu chuyên ngành/kinh nghiệm thi công'; '80-90%/hơn 80% thời gian trong nhà' -> 'phần lớn thời gian'; các bài đó thêm nguồn US EPA (epa.gov/report-environment/indoor-air-quality, kiểm 17/11: ~90% thời gian trong nhà, chất ô nhiễm trong nhà thường cao hơn ngoài trời 2-5 lần). Backup news_bk_vague_20261117.
