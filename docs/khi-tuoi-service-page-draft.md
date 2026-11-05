# Trang dịch vụ "Cung cấp lắp đặt hệ thống cấp gió tươi, lọc không khí" — bản nháp nội dung

**Status:** Đã ghi vào DB prod và đang hiển thị trên site (2026-11-06): `services.content` (TipTap), `meta_title`, `meta_description`, và 8 FAQ mới vào bảng `faqs` (service này có 10 FAQ). Khác bản nháp: bỏ sơ đồ ASCII, bỏ công thức chọn công suất (chưa đối chiếu tiêu chuẩn), bảo hành thi công ghi "theo hợp đồng", FAQ nằm ở bảng `faqs` chứ không nằm trong thân bài. Việc nối link nội bộ từ tin tức và dự án về trang này chưa làm.
**Mục tiêu:** biến `/dich-vu/cung-cap-lap-dat-he-thong-cap-gio-tuoi-loc-khong-khi` (hiện `content = null`, ~208 từ hiển thị, meta_title lệch H1) thành trang trụ cột cho cụm khí tươi. Không tạo trang mới. Số liệu nền: `dienmayelc-gsc-baseline-2026-11-05`.

Quy ước: `[ELC XÁC NHẬN: ...]` là chỗ chưa có thông tin thật, không được tự điền. `[ĐỐI CHIẾU: ...]` là số kỹ thuật cần kiểm tra với tiêu chuẩn hiện hành trước khi đăng.

## Việc sửa ngoài thân bài (services row, DB prod)

| Trường | Hiện tại | Đề xuất |
|---|---|---|
| `meta_title` | Lắp Đặt Máy Lọc Không Khí Chính Hãng Uy Tín | Lắp đặt hệ thống cấp gió tươi thu hồi nhiệt \| Điện máy ELC |
| `meta_description` | Cung cấp dịch vụ lắp đặt máy lọc không khí chất lượng cao... | Điện máy ELC khảo sát miễn phí, thiết kế và lắp đặt hệ thống cấp gió tươi thu hồi nhiệt cho biệt thự, nhà phố, văn phòng. Báo giá trọn gói hoặc theo hạng mục. |
| `price_display_text` | Liên hệ để nhận giá ưu đãi | Khảo sát miễn phí, báo giá trọn gói (giữ nguyên nếu user muốn) |
| `content` | `null` | Thân bài bên dưới (cần chuyển sang JSON TipTap khi ghi DB) |

H1 giữ nguyên: "Cung cấp lắp đặt hệ thống cấp gió tươi, lọc không khí".

---

## Hệ thống cấp gió tươi là gì

Hệ thống cấp gió tươi (nhiều người gọi là máy lọc không khí tươi, máy cấp khí tươi hay máy thông gió) đưa không khí từ bên ngoài vào nhà một cách có kiểm soát, qua bộ lọc, đồng thời đẩy không khí cũ trong phòng ra ngoài.

Nó khác máy lọc không khí thông thường. Máy lọc chỉ làm sạch không khí đang có sẵn trong phòng rồi thổi lại vào phòng, không đưa thêm khí mới từ ngoài vào. Hệ thống cấp gió tươi thì thay không khí.

## Khi nào công trình cần

- Nhà, căn hộ, văn phòng đóng kín cửa và chạy điều hòa liên tục.
- Không gian đông người trong thời gian dài: phòng họp, văn phòng, quán, nhà hàng.
- Công trình ít cửa sổ hoặc cửa sổ không mở được.
- Nhà ở khu nhiều bụi hoặc ồn, nơi mở cửa để lấy gió không thực tế.

## Nguyên lý thu hồi nhiệt

Khí cũ trong phòng đã được làm mát, khí mới từ ngoài thì nóng hơn. Nếu đẩy thẳng khí cũ ra và hút khí nóng vào, điều hòa phải làm mát lại từ đầu. Bộ thu hồi nhiệt cho hai luồng khí chạy qua nhau, trao đổi nhiệt mà không trộn lẫn, nên khí mới vào đã bớt nóng trước khi vào phòng.

```
 Khí ngoài (nóng, bụi)          Khí vào phòng (đã bớt nóng, đã lọc)
        |                                   ^
        v                                   |
   +-----------------------------------------------+
   |   bộ lọc ->  [ BỘ TRAO ĐỔI NHIỆT ]  -> quạt   |
   |                     ^   |                     |
   |                     |   v                     |
   +-----------------------------------------------+
        ^                                   |
        |                                   v
 Khí cũ trong phòng (mát)           Khí thải ra ngoài
```

Hiệu suất thu hồi và lưu lượng gió khác nhau giữa các model. Xem thông số từng máy tại [nhóm máy cấp khí tươi thu hồi nhiệt](/san-pham/may-cap-khi-tuoi-thu-hoi-nhiet).

## Một hệ thống gồm những gì

- **Máy cấp khí tươi** (có bộ lọc và bộ thu hồi nhiệt).
- **Đường ống** dẫn khí lấy vào, khí cấp và khí thải.
- **Cửa gió** cấp và hồi trong phòng.
- **Bộ điều khiển** (tuỳ model).

ELC cung cấp đồng bộ máy và phụ kiện: xem [phụ kiện đồng bộ của hệ thống cấp gió tươi](/san-pham/phu-kien-dong-bo-cua-he-thong-cap-gio-tuoi).

## Chọn công suất máy

Lưu lượng gió tươi cần cấp phụ thuộc vào số người và diện tích sử dụng, và loại công trình quyết định mức yêu cầu.

```
Lưu lượng cần cấp = (số người x lưu lượng mỗi người) + (diện tích x lưu lượng mỗi m2)
```

`[ĐỐI CHIẾU: giá trị lưu lượng mỗi người và mỗi m2 theo loại công trình, từ TCVN thông gió hiện hành và ASHRAE 62.1. Không điền số từ trí nhớ.]`

Kỹ sư ELC tính lưu lượng theo từng công trình khi khảo sát, nên khách không cần tự tính.

## Quy trình thực hiện tại ELC

Khung 5 bước dưới đây lấy từ trang [Quy trình thi công lắp đặt](/quy-trinh-thi-cong-lap-dat-may-lanh-chuan-ky-thuat-tai-dien-may-elc) của ELC, điều chỉnh cho hệ thống cấp gió tươi.

1. **Khảo sát hiện trường (miễn phí).** Kỹ sư đo đạc không gian, xem vị trí đặt máy, đường ống và vị trí lấy/thải gió, rồi tư vấn công suất.
2. **Thiết kế.** Bản vẽ vị trí máy, lộ trình ống, vị trí cửa gió. Với biệt thự, phối hợp với đơn vị nội thất về cửa gió.
3. **Chuẩn bị thiết bị và vật tư.** Máy cấp khí tươi thu hồi nhiệt cùng phụ kiện đồng bộ: ống cấp gió tươi HDPE 2 lớp kháng khuẩn, kháng nấm (D75) kèm co nối, bộ hợp lưu và ron cao su chống rò rỉ; cửa gió nhựa chỉnh được lưu lượng; ống gió mềm hoặc ống gió nhựa chuyên dụng bọc bảo ôn cách nhiệt. *(Nguồn trên site: trang Phụ kiện Menred, dự án Nhà hàng chay Liên Hoa.)*
4. **Thi công lắp đặt.** Tính toán đường ống để hạn chế can thiệp vào kết cấu; đi ống âm trần; treo ống bằng đai giảm chấn để giảm rung; đặt máy ở khu kỹ thuật dễ bảo trì và bọc tiêu âm; bố trí miệng cấp và hồi hài hòa với nội thất. Với nhà đang ở, chia giai đoạn thi công để ít ảnh hưởng sinh hoạt. *(Nguồn trên site: các dự án Him Lam, Liên Hoa và nhóm dự án khí tươi.)*
5. **Hiệu chỉnh, nghiệm thu, bàn giao.** Đo lưu lượng gió bằng thiết bị chuyên dụng, cân chỉnh lưu lượng tại từng cửa cấp và cửa hút (Testing & Balancing), kiểm tra độ ồn khi vận hành thực tế, chạy thử rồi bàn giao. *(Nguồn trên site: các dự án villa và biệt thự.)*

Không dùng lại các câu quảng cáo có trong dự án như "độ ồn tiệm cận mức 0" hay "giảm tải điện năng lên tới 30%", vì chưa có số đo đi kèm.

### Những điểm quyết định chất lượng lắp đặt (nguyên tắc chung) `[CHỜ USER CHỌN GIỮ HOẶC BỎ; KỸ SƯ ELC ĐỌC LẠI]`

Đây là nguyên tắc chung của hệ thống thông gió cơ khí, **không phải câu ELC đã nói** trên site. Viết như kiến thức, không viết thành cam kết của ELC.

- Cửa lấy gió ngoài đặt cách xa cửa thải gió và xa nguồn ô nhiễm (khói bếp, ống khói, bãi xe), để máy không hút lại khí thải.
- Đường ống ngắn, ít co cút, để giảm tiếng ồn và giảm trở lực.
- Bọc cách nhiệt ống đi qua vùng nóng ẩm để tránh đọng nước.
- Cửa lấy và thải gió ngoài trời có chụp hoặc lưới chắn mưa và côn trùng.
- Chừa cửa thăm hoặc không gian để vệ sinh, thay lõi lọc sau này.

**Bảo hành.** Thiết bị bảo hành theo chính sách của hãng (xem [chính sách bảo hành](/chinh-sach-bao-hanh-san-pham)). `[ELC XÁC NHẬN: thời hạn bảo hành thi công/lắp đặt. Đã tìm trong 25 dự án khí tươi: không trang nào ghi thời hạn. Chỉ có một dự án VRV ghi "bảo trì định kỳ 6 tháng/lần cho hệ thống và bộ lọc khí".]`

## Công trình ELC đã thực hiện

Một số hệ thống cấp khí tươi thu hồi nhiệt Menred Hagisu ELC đã hoàn thành (xem tất cả tại mục Dự án):

- [Biệt thự Him Lam, Quận 7](/du-an/dien-may-elc-hoan-thanh-he-thong-loc-cap-khi-tuoi-thu-hoi-nhiet-menred-hagisu-cho-biet-thu-him-lam-quan-7)
- [Biệt thự Centuria Vườn Lài, Quận 12](/du-an/dien-may-elc-hoan-thanh-he-thong-loc-cap-khi-tuoi-thu-hoi-nhiet-menred-hagisu-cho-biet-thu-centuria-vuon-lai-quan-12)
- [Nhà phố tại Long An](/du-an/dien-may-elc-hoan-thanh-he-thong-cap-gio-tuoi-thu-hoi-nhiet-loc-khong-khi-menred-hagisu-cho-nha-pho-tai-long-an)
- [Nhà phố tại An Lạc, Bình Tân](/du-an/dien-may-elc-hoan-thanh-he-thong-loc-cap-khi-tuoi-thu-hoi-nhiet-menred-hagisu-cho-nha-pho-tai-an-lac-binh-tan)
- [Khối văn phòng Công ty TNHH Chế biến Hải sản Trọng Đức, Bà Rịa - Vũng Tàu](/du-an/dien-may-elc-hoan-thanh-he-thong-loc-cap-khi-tuoi-thu-hoi-nhiet-menred-hagisu-cho-khoi-van-phong-cong-ty-tnhh-che-bien-hai-san-trong-duc-ba-ria-vung-tau)
- [Trụ sở Đảng ủy phường Long Phước](/du-an/dien-may-elc-hoan-thanh-he-thong-dieu-hoa-khong-khi-va-khi-tuoi-cho-van-phong-dang-uy-phuong-long-phuoc)

## Thiết bị ELC cung cấp

ELC phân phối máy cấp khí tươi thu hồi nhiệt Menred. Xem [toàn bộ máy cấp khí tươi thu hồi nhiệt](/san-pham/may-cap-khi-tuoi-thu-hoi-nhiet) hoặc [thương hiệu Menred](/san-pham/menred).

## Câu hỏi thường gặp

**Hệ thống cấp gió tươi khác máy lọc không khí ở điểm nào?**
Máy lọc không khí làm sạch không khí đang có trong phòng, không đưa không khí mới vào. Hệ thống cấp gió tươi lấy không khí từ ngoài, lọc rồi cấp vào phòng, đồng thời đẩy không khí cũ ra ngoài.

**Nhà đã có điều hòa thì có cần thêm không?**
Phần lớn điều hòa dân dụng làm mát và tuần hoàn không khí trong phòng, không lấy gió từ ngoài vào. Nếu phòng đóng kín nhiều giờ, nên cân nhắc thêm hệ thống cấp gió tươi. Tuỳ công trình cụ thể, ELC tư vấn khi khảo sát.

**Thu hồi nhiệt nghĩa là gì?**
Là bộ phận cho khí cũ và khí mới trao đổi nhiệt với nhau mà không trộn lẫn, để khí mới vào phòng đỡ nóng hơn so với hút thẳng từ ngoài.

**Máy có tốn điện không?**
Có, vì máy dùng quạt để chạy liên tục. Công suất điện khác nhau theo từng model, xem trong thông số của từng sản phẩm.

**Nhà đã xây xong có lắp được không?**
Thường là có, nhưng tuỳ vào không gian trần, vị trí đi ống và vị trí lấy/thải gió. ELC khảo sát hiện trường trước khi kết luận.

**Có phải khoan tường không?**
Thường cần có vị trí để lấy khí ngoài và thải khí ra, qua tường hoặc mái tuỳ công trình. Vị trí cụ thể được xác định khi khảo sát.

**Lõi lọc có phải thay không?**
Có, bộ lọc cần vệ sinh hoặc thay định kỳ. Chu kỳ theo hướng dẫn của từng model.

**Chi phí được tính thế nào?**
ELC khảo sát miễn phí. Sau khảo sát, ELC báo giá trọn gói cho cả hệ thống, và có thể báo theo từng hạng mục nếu khách muốn.

## Kêu gọi hành động

Khảo sát miễn phí tại công trình của bạn. Liên hệ ELC để được kỹ sư tư vấn và báo giá. (Dùng nút liên hệ đang có, giữ nguyên tracking `contact-click`.)

---

## Việc nối link nội bộ sau khi đăng

Từ 10 bài tin khí tươi và 27 trang dự án, thêm một liên kết về trang này với anchor "hệ thống cấp gió tươi" (hoặc "lắp đặt hệ thống cấp gió tươi"). Không sửa nội dung bài, chỉ thêm liên kết. Danh sách bài tin:

- `/tin-tuc/he-thong-thu-hoi-nhiet-la-gi-va-vi-sao-duoc-ua-chuong-trong-cac-cong-trinh-hien-dai`
- `/tin-tuc/su-khac-biet-giua-may-loc-khong-khi-truyen-thong-va-he-thong-cap-khi-tuoi-toan-dien`
- `/tin-tuc/tai-sao-may-lanh-can-ket-hop-he-thong-cap-khi-tuoi`
- `/tin-tuc/he-thong-ervhrv-bi-quyet-tiet-kiem-20-40-dien-nang-cho-may-lanh` (có số "20-40%" chưa kiểm chứng, nên xem lại trước khi dẫn thêm traffic vào)
- 6 bài còn lại cùng cụm.
