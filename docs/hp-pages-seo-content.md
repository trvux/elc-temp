# Nội dung SEO cho các trang HP (máy lạnh theo công suất)

Nội dung đã tách 3 phần riêng biệt cho mỗi trang, khớp với kiến trúc dữ liệu sẽ triển khai (xem `project_hp_page_faq_schema.md` trong memory):

- **Content** — dán vào field `content` (rich text) của trang HP trong CMS. Không chứa FAQ, không gắn tên "đội kỹ thuật ELC" (tác giả sẽ là field riêng `author_id`, chọn từ entity `Author` có sẵn — không viết cứng trong nội dung).
- **FAQ** — danh sách câu hỏi/trả lời riêng, sẽ map vào field `faq_items` (jsonb, mảng `{question, answer}`) khi build tính năng FAQPage JSON-LD dùng chung cho category/brand/hp_page.
- **Author** — không cần nội dung viết tay, chỉ cần chọn 1 author có sẵn trong CMS khi tạo/sửa trang (không tự động được).

Trạng thái: **1HP → 10HP đã viết xong** (11 trang, không tính trang thương hiệu Daikin dùng khác cơ chế). Cấu trúc mỗi trang: heading trả lời trực tiếp (AIO answer-first) → đoạn thực tế sử dụng/khảo sát (kinh nghiệm, không gắn tên đội) → bảng thông số kỹ thuật → tính tiền điện/tháng → gợi ý chọn hãng → (FAQ tách riêng bên dưới).

---

## 1HP — `may-lanh-1hp`

### Content

**Máy lạnh 1HP – công suất nhỏ gọn cho phòng ngủ đơn, phòng trọ, không gian dưới 15m²**

Máy lạnh 1HP có công suất lạnh 9.000 BTU/h, phù hợp phòng kín 9–15m², là công suất phổ biến nhất cho phòng ngủ đơn, phòng trọ sinh viên, phòng làm việc cá nhân. "1HP" và "1 ngựa" là cùng một đơn vị công suất máy lạnh.

**Qua khảo sát thực tế lắp đặt tại nhiều căn hộ/phòng trọ, sai lầm phổ biến nhất ở phân khúc 1HP là đặt máy trong phòng có gác lửng hoặc trần thông với khu vực khác** (bếp, ban công không có cửa ngăn) — khi đó diện tích thực tế cần làm mát lớn hơn diện tích sàn phòng ngủ, máy 1HP phải chạy liên tục mà vẫn không đạt nhiệt độ mong muốn. Nếu phòng có kết cấu mở như vậy, nên cân nhắc lên 1.5HP dù diện tích sàn danh nghĩa vẫn dưới 15m².

Ngược lại, với phòng kín hoàn toàn, trần thấp dưới 2,8m, không có thiết bị toả nhiệt lớn (không đặt tủ lạnh/bàn là trong phòng), máy 1HP làm lạnh phòng 12m² đạt 26°C trong khoảng 8–10 phút.

**Thông số kỹ thuật máy lạnh 1HP**

| Thông số | Giá trị |
|---|---|
| Công suất lạnh | 9.000 BTU/h (~2,6 kW) |
| Diện tích phòng phù hợp | 9–15 m² |
| Công suất tiêu thụ điện (Inverter) | ~900–1.050 W định mức |
| Dòng điện định mức | 4–5 A |
| Nguồn điện | 1 pha 220V |
| Gas lạnh | R32 |

**Máy lạnh 1HP tốn bao nhiêu tiền điện mỗi tháng?**

Máy Inverter 1HP chạy 8 tiếng/ngày ở 26°C tiêu thụ trung bình thực tế khoảng 450–500W (không phải công suất định mức ~1.000W) — tương đương **~120 kWh/tháng, khoảng 330.000–350.000đ/tháng**. Đây là công suất tiết kiệm điện nhất trong dải sản phẩm.

**Nên chọn máy lạnh 1HP hãng nào**

- **Casper, LG** — giá tốt, phù hợp phòng trọ/căn hộ cho thuê cần đầu tư số lượng lớn với ngân sách hạn chế.
- **Daikin** — bền hơn về lâu dài, phù hợp dùng cho phòng riêng lâu dài, giá cao hơn khoảng 15–20% so với Casper cùng công suất.
- **Panasonic** — vận hành êm, phù hợp phòng ngủ cần yên tĩnh khi ngủ.

*Các thông số trên mang tính tham khảo — thông số chính xác của từng model xem tại bảng thông số sản phẩm.*

### FAQ

1. **Máy lạnh 1HP là bao nhiêu BTU?**
   9.000 BTU/h.
2. **Phòng trọ 12m² có gác lửng nên dùng máy mấy HP?**
   Nếu gác lửng thông trực tiếp với phòng ngủ (không có vách ngăn kín), nên cân nhắc 1.5HP thay vì 1HP vì diện tích thực tế cần làm mát lớn hơn diện tích sàn.
3. **Máy lạnh 1HP có đủ mát cho phòng 18m² không?**
   Không nên — 18m² vượt ngưỡng khuyến nghị của máy 1HP (9–15m²), nên dùng 1.5HP.

---

## 1.5HP — `may-lanh-15hp`

### Content

**Máy lạnh 1.5HP – công suất chuẩn cho phòng ngủ 15–20m², bán chạy nhất thị trường**

Máy lạnh 1.5HP có công suất lạnh 12.000 BTU/h, phù hợp phòng kín 15–20m², là công suất bán chạy nhất vì khớp với diện tích phòng ngủ tiêu chuẩn của căn hộ/nhà phố Việt Nam.

**Qua khảo sát thực tế, phân khúc 1.5HP là nơi khách hàng dễ chọn đúng nhất** vì hầu hết phòng ngủ tiêu chuẩn (16–20m²) khớp thẳng với ngưỡng khuyến nghị. Điểm cần lưu ý duy nhất: **phòng ngủ có bàn làm việc + máy tính để bàn hoạt động nhiều giờ** nên cộng thêm một bậc tải nhiệt — nếu phòng 19–20m² và dùng máy tính bàn hiệu năng cao liên tục, nên cân nhắc 2HP để máy không phải chạy full tải kéo dài.

**Thông số kỹ thuật máy lạnh 1.5HP**

| Thông số | Giá trị |
|---|---|
| Công suất lạnh | 12.000 BTU/h (~3,5 kW) |
| Diện tích phòng phù hợp | 15–20 m² |
| Công suất tiêu thụ điện (Inverter) | ~1.250–1.450 W định mức |
| Dòng điện định mức | 6–7 A |
| Nguồn điện | 1 pha 220V |
| Gas lạnh | R32 |

**Máy lạnh 1.5HP tốn bao nhiêu tiền điện mỗi tháng?**

Chạy 8 tiếng/ngày ở 26°C, mức tiêu thụ trung bình thực tế khoảng 600–650W — tương đương **~156 kWh/tháng, khoảng 435.000–450.000đ/tháng**.

**Nên chọn máy lạnh 1.5HP hãng nào**

- **LG, Casper** — công thái tốt/giá tốt, được chọn nhiều nhất ở phân khúc phòng ngủ gia đình.
- **Daikin** — nếu ưu tiên độ bền lâu dài trên 10 năm, đặc biệt phù hợp căn hộ chính chủ ở lâu dài.
- **Panasonic** — vận hành êm nhất trong 4 hãng, phù hợp người ngủ nhạy tiếng ồn.

### FAQ

1. **Máy lạnh 1.5HP là bao nhiêu BTU?**
   12.000 BTU/h.
2. **Phòng ngủ 20m² có nên dùng 1.5HP không?**
   Có, 20m² là ngưỡng trên của khuyến nghị 1.5HP — vẫn đáp ứng tốt nếu phòng kín, không có thiết bị toả nhiệt lớn liên tục.
3. **1.5HP và 1HP khác nhau bao nhiêu điện?**
   Máy 1.5HP tốn điện nhiều hơn 1HP khoảng 25–30%, đổi lại làm lạnh được diện tích lớn hơn ~30–35%.

---

## 2HP — `may-lanh-2hp`

### Content

**Máy lạnh 2HP – công suất phổ biến nhất cho phòng khách 20–30m², chi tiết kỹ thuật và kinh nghiệm chọn mua thực tế**

Máy lạnh 2HP có công suất lạnh 18.000 BTU/h, phù hợp phòng kín 20–30m², là công suất được tư vấn nhiều nhất cho phòng khách chung cư và phòng ngủ master. "2HP" và "2 ngựa" là cùng một đơn vị công suất (Horse Power), người dùng dùng thay thế nhau tuỳ thói quen gọi.

**Qua thực tế lắp đặt tại khu vực TP.HCM, có hai tình huống khách hàng hay chọn sai công suất:**

- **Phòng khách có 1 mặt kính lớn hướng Tây/Tây Nam** — dù diện tích chỉ 22–24m² (vẫn nằm trong ngưỡng lý thuyết của máy 1.5HP), nhiệt bức xạ qua kính buổi chiều khiến máy 1.5HP phải chạy full tải liên tục 3–4 tiếng mới đạt nhiệt độ cài đặt. Với hướng nắng này, nên lên thẳng 2HP dù diện tích danh nghĩa chưa tới ngưỡng.
- **Phòng ngủ trần giật cấp cao trên 3m** — thể tích không khí cần làm lạnh lớn hơn số liệu diện tích sàn phản ánh; máy 1.5HP trong trường hợp này thường mất 20–25 phút để đạt 26°C, trong khi máy 2HP đạt trong khoảng 12–15 phút ở cùng điều kiện.

Ngược lại, nếu phòng kín, trần chuẩn 2,8m, không có mặt kính lớn hướng nắng gắt, máy 1.5HP vẫn đáp ứng tốt cho phòng tới 20m² — không cần lên 2HP chỉ vì "cho chắc", vì công suất dư sẽ khiến máy đóng/ngắt liên tục ở chế độ non-Inverter hoặc chạy non-tải thấp kéo dài ở Inverter, giảm tuổi thọ block nén về lâu dài.

**Thông số kỹ thuật máy lạnh 2HP**

| Thông số | Giá trị |
|---|---|
| Công suất lạnh | 18.000 BTU/h (~5,3 kW) |
| Diện tích phòng phù hợp | 20–30 m² (phòng kín, trần chuẩn 2,8–3m) |
| Công suất tiêu thụ điện (Inverter) | ~1.900–2.200 W định mức |
| Dòng điện định mức | 8–9 A |
| Nguồn điện | 1 pha 220V |
| Gas lạnh | R32 (phổ biến trên model đời mới) |

**Máy lạnh 2HP tốn bao nhiêu tiền điện mỗi tháng?**

Với máy Inverter chạy trung bình 8 tiếng/ngày ở 26°C, mức tiêu thụ điện thực tế trung bình khoảng 900–1.200W (không phải công suất định mức 2.000W) — tương đương **~240 kWh/tháng, khoảng 670.000–750.000đ/tháng**. Con số này giảm 15–20% nếu vệ sinh dàn lạnh định kỳ 3–4 tháng/lần.

*Lưu ý: đây là số liệu tham khảo dựa trên điều kiện sử dụng trung bình — mức tiêu thụ thực tế phụ thuộc thói quen sử dụng và điều kiện phòng cụ thể.*

**Nên chọn máy lạnh 2HP hãng nào**

- **Daikin** — block nén bền, phổ biến trong các công trình/dự án tại Việt Nam nhờ độ ổn định dài hạn, giá cao hơn mặt bằng chung.
- **LG** — cân bằng tốt giữa tiết kiệm điện và giá thành, phù hợp nhu cầu gia đình phổ thông.
- **Panasonic** — vận hành êm, phù hợp phòng ngủ.
- **Casper** — giá tốt nhất trong 4 hãng, phù hợp ngân sách hạn chế; đánh đổi là độ bền block nén sau 5–7 năm thường không bằng Daikin/LG theo ghi nhận bảo hành thực tế.

### FAQ

1. **Máy lạnh 2HP là bao nhiêu BTU?**
   18.000 BTU/h.
2. **Phòng 25m² có mặt kính lớn hướng Tây nên dùng máy mấy HP?**
   Nên dùng 2HP thay vì 1.5HP dù diện tích lý thuyết vẫn trong ngưỡng 1.5HP, vì nhiệt bức xạ qua kính hướng Tây làm tăng tải nhiệt thực tế.
3. **Máy lạnh 2HP Inverter tiết kiệm điện hơn máy thường bao nhiêu?**
   Khoảng 30–40% khi sử dụng trên 6 tiếng/ngày.

---

## 2.5HP — `may-lanh-25hp`

### Content

**Máy lạnh 2.5HP – bước đệm giữa phòng khách nhỏ và không gian văn phòng 30–40m²**

Máy lạnh 2.5HP có công suất lạnh 21.000–24.000 BTU/h, phù hợp không gian 30–40m², thường được chọn cho phòng khách liền bếp không vách ngăn hoặc văn phòng nhỏ 3–4 người.

**2.5HP là công suất khách hàng hay phân vân giữa lên 3HP "cho chắc" hoặc giữ 2HP "tiết kiệm hơn".** Qua kinh nghiệm tư vấn thực tế: nếu không gian là **phòng khách liền bếp** (không có vách ngăn, bếp toả nhiệt khi nấu), 2.5HP là lựa chọn cân bằng hợp lý hơn 2HP — vì bếp là nguồn nhiệt bổ sung thường bị bỏ qua khi tính diện tích. Nếu không gian là văn phòng thuần (không có nguồn nhiệt phụ), 2HP vẫn đủ cho tới 28–30m².

**Thông số kỹ thuật máy lạnh 2.5HP**

| Thông số | Giá trị |
|---|---|
| Công suất lạnh | 21.000–24.000 BTU/h |
| Diện tích phòng phù hợp | 30–40 m² |
| Công suất tiêu thụ điện (Inverter) | ~2.300–2.600 W định mức |
| Dòng điện định mức | 10–11 A |
| Nguồn điện | 1 pha 220V |
| Loại dàn lạnh phổ biến | Áp trần hoặc tủ đứng |

**Máy lạnh 2.5HP tốn bao nhiêu tiền điện mỗi tháng?**

Chạy 8 tiếng/ngày, tiêu thụ trung bình thực tế khoảng 1.150–1.250W — tương đương **~288 kWh/tháng, khoảng 800.000–850.000đ/tháng**.

**Nên chọn máy lạnh 2.5HP hãng nào**

- **Daikin** — phổ biến cho văn phòng/phòng khám do độ bền và bảo hành công trình tốt.
- **LG** — cân bằng giá/hiệu năng, phù hợp phòng khách gia đình.
- **Panasonic** — phù hợp không gian cần vận hành êm liên tục (phòng khám, phòng họp nhỏ).

### FAQ

1. **Máy lạnh 2.5HP là bao nhiêu BTU?**
   21.000–24.000 BTU/h tuỳ hãng và model.
2. **Phòng khách liền bếp 32m² nên dùng máy mấy HP?**
   Nên dùng 2.5HP thay vì 2HP, vì bếp là nguồn nhiệt bổ sung khiến tải nhiệt thực tế cao hơn diện tích sàn phản ánh.

---

## 3HP — `may-lanh-3hp`

### Content

**Máy lạnh 3HP – công suất phổ biến cho phòng khách lớn, cửa hàng nhỏ 40–50m²**

Máy lạnh 3HP có công suất lạnh 28.000 BTU/h, phù hợp không gian 40–50m², phổ biến cho phòng khách nhà phố có thông tầng hoặc cửa hàng/showroom nhỏ.

**Ở mức 3HP, khách hàng bắt đầu phải chọn giữa bản 1 pha và 3 pha** (một số model 3HP có cả hai). Với hộ gia đình dùng điện sinh hoạt thông thường, nên chọn bản 1 pha để tránh phải cải tạo đường điện; với cửa hàng/công trình đã có sẵn điện 3 pha, bản 3 pha thường có giá tốt hơn và vận hành ổn định hơn khi chạy nhiều giờ liên tục.

**Thông số kỹ thuật máy lạnh 3HP**

| Thông số | Giá trị |
|---|---|
| Công suất lạnh | 28.000 BTU/h |
| Diện tích phòng phù hợp | 40–50 m² |
| Công suất tiêu thụ điện (Inverter) | ~2.900–3.200 W định mức |
| Dòng điện định mức | 13–14 A |
| Nguồn điện | 1 pha hoặc 3 pha 220/380V tuỳ model |
| Loại dàn lạnh phổ biến | Áp trần hoặc tủ đứng |

**Máy lạnh 3HP tốn bao nhiêu tiền điện mỗi tháng?**

Chạy 8 tiếng/ngày, tiêu thụ trung bình thực tế khoảng 1.400–1.500W — tương đương **~360 kWh/tháng, khoảng 1.000.000–1.050.000đ/tháng**. Với cửa hàng chạy 10–12 tiếng/ngày, chi phí thực tế cao hơn đáng kể, nên tính lại theo giờ vận hành thực tế.

**Nên chọn máy lạnh 3HP hãng nào**

- **Daikin** — lựa chọn hàng đầu cho cửa hàng/công trình cần chạy liên tục nhiều giờ, block nén bền dưới tải cao.
- **LG** — cân bằng giá/hiệu năng cho phòng khách gia đình.
- **Casper** — phù hợp ngân sách hạn chế nếu chỉ dùng sinh hoạt gia đình (không chạy liên tục 10+ tiếng/ngày).

### FAQ

1. **Máy lạnh 3HP là bao nhiêu BTU?**
   28.000 BTU/h.
2. **Cửa hàng 45m² nên dùng máy lạnh mấy HP?**
   3HP là mức phù hợp cho 45m² nếu là không gian bán lẻ thông thường; nếu có nhiều tủ mát/thiết bị toả nhiệt, nên khảo sát thực tế để cân nhắc lên 3.5HP.

---

## 3.5HP — `may-lanh-35hp`

### Content

**Máy lạnh 3.5HP – công suất trung bình cho nhà hàng nhỏ, phòng gym mini 50–60m²**

Máy lạnh 3.5HP có công suất lạnh 36.000 BTU/h, phù hợp không gian 50–60m², phổ biến cho nhà hàng/quán ăn quy mô nhỏ và phòng gym mini.

**Không gian thương mại như nhà hàng, quán ăn thường có mật độ người và thiết bị bếp toả nhiệt cao hơn nhiều so với văn phòng cùng diện tích** — nên khảo sát riêng số lượng bàn/khách tối đa và vị trí bếp trước khi chốt công suất, vì áp dụng công thức m²-thuần cho loại hình này thường dẫn đến thiếu công suất trong giờ cao điểm.

**Thông số kỹ thuật máy lạnh 3.5HP**

| Thông số | Giá trị |
|---|---|
| Công suất lạnh | 36.000 BTU/h |
| Diện tích phòng phù hợp | 50–60 m² |
| Công suất tiêu thụ điện (Inverter) | ~3.700–4.000 W định mức |
| Dòng điện định mức | 15–16 A |
| Nguồn điện | 1 pha hoặc 3 pha tuỳ model |
| Loại dàn lạnh phổ biến | Áp trần hoặc tủ đứng |

**Máy lạnh 3.5HP tốn bao nhiêu tiền điện mỗi tháng?**

Chạy 8 tiếng/ngày, tiêu thụ trung bình thực tế khoảng 1.850–1.950W — tương đương **~456 kWh/tháng, khoảng 1.275.000–1.300.000đ/tháng** (tăng đáng kể với nhà hàng chạy 10–14 tiếng/ngày).

**Nên chọn máy lạnh 3.5HP hãng nào**

- **Daikin** — phù hợp không gian thương mại chạy liên tục nhiều giờ, độ ổn định cao dưới tải nặng.
- **LG** — cân bằng giá/hiệu năng cho phòng gym/studio.

### FAQ

1. **Máy lạnh 3.5HP là bao nhiêu BTU?**
   36.000 BTU/h.
2. **Nhà hàng 55m² có bếp mở nên dùng máy lạnh mấy HP?**
   Nên khảo sát thực tế thay vì áp công thức thuần diện tích — bếp mở toả nhiệt liên tục thường cần công suất cao hơn mức lý thuyết, có thể cần 4HP thay vì 3.5HP.

---

## 4HP — `may-lanh-4hp`

### Content

**Máy lạnh 4HP – công suất cho showroom, văn phòng lớn 60–80m²**

Máy lạnh 4HP có công suất lạnh 40.000–48.000 BTU/h, phù hợp không gian 60–80m², phổ biến cho showroom, văn phòng mở và nhà hàng vừa.

**Từ 4HP trở lên, phần lớn model chuyển sang nguồn điện 3 pha** — đây là điểm khách hàng doanh nghiệp cần xác nhận trước khi đặt hàng, vì mặt bằng thuê chưa chắc đã có sẵn đường điện 3 pha, phát sinh thêm chi phí cải tạo điện nếu chưa khảo sát trước.

**Thông số kỹ thuật máy lạnh 4HP**

| Thông số | Giá trị |
|---|---|
| Công suất lạnh | 40.000–48.000 BTU/h |
| Diện tích phòng phù hợp | 60–80 m² |
| Công suất tiêu thụ điện (Inverter) | ~4.400–4.900 W định mức |
| Dòng điện định mức | 18–20 A |
| Nguồn điện | 3 pha phổ biến |
| Loại dàn lạnh phổ biến | Áp trần hoặc tủ đứng |

**Máy lạnh 4HP tốn bao nhiêu tiền điện mỗi tháng?**

Chạy 8 tiếng/ngày, tiêu thụ trung bình thực tế khoảng 2.250–2.350W — tương đương **~552 kWh/tháng, khoảng 1.545.000–1.600.000đ/tháng** (con số này chỉ tham khảo cho mức sử dụng sinh hoạt; showroom/văn phòng chạy giờ hành chính 10 tiếng/ngày sẽ cao hơn tương ứng).

**Nên chọn máy lạnh 4HP hãng nào**

- **Daikin** — lựa chọn phổ biến nhất cho công trình/showroom cần vận hành ổn định nhiều giờ liên tục, hỗ trợ tốt về bảo hành công trình.
- **LG** — cân bằng giá/hiệu năng cho văn phòng vừa.

### FAQ

1. **Máy lạnh 4HP là bao nhiêu BTU?**
   40.000–48.000 BTU/h tuỳ hãng và model.
2. **Máy lạnh 4HP có bắt buộc dùng điện 3 pha không?**
   Đa số model 4HP dùng điện 3 pha; nên xác nhận với đơn vị bán trước khi đặt hàng nếu mặt bằng chưa có sẵn đường điện 3 pha.

---

## 4.5HP — `may-lanh-45hp`

### Content

**Máy lạnh 4.5HP – công suất cho hội trường nhỏ, không gian 80–90m²**

Máy lạnh 4.5HP có công suất lạnh khoảng 48.000–52.000 BTU/h, phù hợp không gian 80–90m², thường dùng cho hội trường nhỏ, phòng đào tạo hoặc văn phòng mở quy mô vừa.

**Ở mức 4.5HP, số lượng người trong phòng ảnh hưởng đáng kể đến tải nhiệt thực tế hơn các mức thấp hơn** — mỗi người tỏa nhiệt trung bình tương đương một bóng đèn 100W đang hoạt động. Với hội trường/phòng đào tạo dự kiến chứa trên 30 người thường xuyên, nên khảo sát thực tế số ghế ngồi tối đa thay vì chỉ tính theo m² sàn — phòng đông người liên tục có thể cần công suất cao hơn mức lý thuyết dù diện tích không đổi.

**Thông số kỹ thuật máy lạnh 4.5HP**

| Thông số | Giá trị |
|---|---|
| Công suất lạnh | 48.000–52.000 BTU/h |
| Diện tích phòng phù hợp | 80–90 m² |
| Công suất tiêu thụ điện (Inverter) | ~5.000–5.400 W định mức |
| Dòng điện định mức | 20–22 A |
| Nguồn điện | 3 pha |
| Loại dàn lạnh phổ biến | Áp trần hoặc tủ đứng |

**Máy lạnh 4.5HP tốn bao nhiêu tiền điện mỗi tháng?**

Chạy 8 tiếng/ngày, tiêu thụ trung bình thực tế khoảng 2.550–2.650W — tương đương **~624 kWh/tháng, khoảng 1.745.000–1.800.000đ/tháng**. Hội trường/phòng đào tạo sử dụng theo lịch (không phải liên tục cả ngày) nên tính lại theo số giờ sử dụng thực tế trong tháng thay vì áp mức 8h/ngày.

**Nên chọn máy lạnh 4.5HP hãng nào**

- **Daikin** — phù hợp hội trường/phòng đào tạo cần độ ổn định cao khi chạy đông người liên tục nhiều giờ.
- **LG** — cân bằng giá/hiệu năng cho văn phòng mở quy mô vừa.

### FAQ

1. **Máy lạnh 4.5HP là bao nhiêu BTU?**
   48.000–52.000 BTU/h.
2. **Hội trường 85m² chứa 40 người nên dùng máy mấy HP?**
   Nên khảo sát thực tế thay vì tính thuần theo m² — mật độ người cao liên tục làm tăng tải nhiệt, có thể cần cân nhắc lên 5HP nếu phòng thường xuyên đông người.

---

## 5HP — `may-lanh-5hp`

### Content

**Máy lạnh 5HP – công suất cho hội trường, nhà xưởng nhỏ 90–100m²**

Máy lạnh 5HP có công suất lạnh 60.000 BTU/h, phù hợp không gian 90–100m², phổ biến cho hội trường vừa, nhà xưởng nhỏ hoặc khu vực sản xuất có máy móc toả nhiệt.

**Với nhà xưởng/khu sản xuất, tải nhiệt không chỉ đến từ diện tích và số người mà còn từ chính máy móc vận hành** — đây là điểm khác biệt lớn nhất so với không gian văn phòng/thương mại cùng diện tích. Trước khi chọn 5HP cho xưởng, nên liệt kê các thiết bị toả nhiệt lớn (máy hàn, lò sấy, tủ điện công suất cao...) để đơn vị lắp đặt tính thêm tải nhiệt phát sinh, tránh tình trạng máy đủ công suất lý thuyết nhưng không đủ mát thực tế khi xưởng vận hành hết công suất.

**Thông số kỹ thuật máy lạnh 5HP**

| Thông số | Giá trị |
|---|---|
| Công suất lạnh | 60.000 BTU/h |
| Diện tích phòng phù hợp | 90–100 m² |
| Công suất tiêu thụ điện (Inverter) | ~6.200–6.700 W định mức |
| Dòng điện định mức | 24–26 A |
| Nguồn điện | 3 pha |
| Loại dàn lạnh phổ biến | Áp trần hoặc tủ đứng công suất lớn |

**Máy lạnh 5HP tốn bao nhiêu tiền điện mỗi tháng?**

Chạy 8 tiếng/ngày, tiêu thụ trung bình thực tế khoảng 3.050–3.150W — tương đương **~744 kWh/tháng, khoảng 2.080.000–2.150.000đ/tháng**. Nhà xưởng vận hành theo ca (thường 10–12 tiếng/ngày hoặc nhiều hơn) sẽ có chi phí thực tế cao hơn con số này đáng kể.

**Nên chọn máy lạnh 5HP hãng nào**

- **Daikin** — được ưu tiên cho nhà xưởng/công trình cần vận hành liên tục nhiều ca, độ bền block nén đã được kiểm chứng qua thời gian dài dưới tải nặng.
- **LG** — lựa chọn thay thế với giá tốt hơn cho hội trường không yêu cầu vận hành liên tục cường độ cao.

### FAQ

1. **Máy lạnh 5HP là bao nhiêu BTU?**
   60.000 BTU/h.
2. **Nhà xưởng có máy móc toả nhiệt nên tính công suất máy lạnh thế nào?**
   Không nên tính thuần theo diện tích — cần liệt kê các thiết bị toả nhiệt lớn trong xưởng để cộng thêm tải nhiệt phát sinh, tránh chọn thiếu công suất so với nhu cầu thực tế.

---

## 5.5HP — `may-lanh-55hp`

### Content

**Máy lạnh 5.5HP – công suất cho không gian thương mại/sản xuất 100–120m²**

Máy lạnh 5.5HP có công suất lạnh khoảng 62.000–65.000 BTU/h, phù hợp không gian 100–120m², thường dùng cho khu vực sản xuất, nhà hàng lớn hoặc hội trường có mật độ sử dụng cao.

**Ở mức 5.5HP, phần lớn công trình đã cần khảo sát riêng thay vì áp dụng bảng công suất chung** — vì ở quy mô này, chênh lệch giữa các loại hình sử dụng (nhà hàng đông khách liên tục vs. kho lưu trữ ít người ra vào) tạo ra khác biệt tải nhiệt rất lớn dù diện tích bằng nhau. Với các dự án ở mức công suất này, nên yêu cầu đơn vị lắp đặt khảo sát thực địa trước khi chốt số lượng và công suất máy.

**Thông số kỹ thuật máy lạnh 5.5HP**

| Thông số | Giá trị |
|---|---|
| Công suất lạnh | 62.000–65.000 BTU/h |
| Diện tích phòng phù hợp | 100–120 m² |
| Công suất tiêu thụ điện (Inverter) | ~6.600–7.100 W định mức |
| Dòng điện định mức | 27–28 A |
| Nguồn điện | 3 pha |
| Loại dàn lạnh phổ biến | Áp trần hoặc tủ đứng công suất lớn |

**Máy lạnh 5.5HP tốn bao nhiêu tiền điện mỗi tháng?**

Chạy 8 tiếng/ngày, tiêu thụ trung bình thực tế khoảng 3.250–3.350W — tương đương **~792 kWh/tháng, khoảng 2.215.000–2.280.000đ/tháng**.

**Nên chọn máy lạnh 5.5HP hãng nào**

- **Daikin** — ưu tiên cho công trình thương mại/sản xuất cần độ ổn định cao và hỗ trợ bảo hành công trình dài hạn.

### FAQ

1. **Máy lạnh 5.5HP là bao nhiêu BTU?**
   62.000–65.000 BTU/h.
2. **Nên chọn 1 máy 5.5HP hay 2 máy nhỏ hơn cộng lại cho không gian 110m²?**
   Tuỳ bố cục thực tế — không gian mở một khối nên dùng 1 máy công suất lớn để tránh vùng lạnh không đều; không gian chia nhiều khu chức năng nên cân nhắc 2 máy nhỏ hơn để dễ bật/tắt riêng từng khu, tiết kiệm điện hơn khi không dùng hết không gian.

---

## 6HP — `may-lanh-6hp`

### Content

**Máy lạnh 6HP – công suất cho nhà hàng lớn, hội trường 120–150m²**

Máy lạnh 6HP có công suất lạnh 68.000–70.000 BTU/h, phù hợp không gian 120–150m², phổ biến cho nhà hàng lớn, hội trường sự kiện hoặc khu vực sản xuất/kho có diện tích rộng.

**Ở mức 6HP, lựa chọn giữa 1 máy công suất lớn và hệ thống multi (nhiều dàn lạnh, 1 dàn nóng) trở thành quyết định quan trọng** — với không gian mở một khối (hội trường, nhà hàng không chia phòng), 1 máy 6HP dạng áp trần/tủ đứng thường tối ưu chi phí lắp đặt hơn. Với không gian chia nhiều phòng chức năng riêng biệt (văn phòng nhiều phòng nhỏ cộng lại đủ diện tích này), hệ thống multi cho phép bật/tắt độc lập từng khu, tiết kiệm điện hơn đáng kể khi không sử dụng hết toàn bộ không gian cùng lúc.

**Thông số kỹ thuật máy lạnh 6HP**

| Thông số | Giá trị |
|---|---|
| Công suất lạnh | 68.000–70.000 BTU/h |
| Diện tích phòng phù hợp | 120–150 m² |
| Công suất tiêu thụ điện (Inverter) | ~7.200–7.600 W định mức |
| Dòng điện định mức | 30–32 A |
| Nguồn điện | 3 pha |
| Loại dàn lạnh phổ biến | Áp trần, tủ đứng hoặc hệ thống multi |

**Máy lạnh 6HP tốn bao nhiêu tiền điện mỗi tháng?**

Chạy 8 tiếng/ngày, tiêu thụ trung bình thực tế khoảng 3.550–3.650W — tương đương **~864 kWh/tháng, khoảng 2.415.000–2.490.000đ/tháng**. Nhà hàng/hội trường vận hành theo khung giờ kinh doanh thực tế (thường không tròn 8 tiếng/ngày) nên tính lại theo lịch sử dụng cụ thể.

**Nên chọn máy lạnh 6HP hãng nào**

- **Daikin** — lựa chọn hàng đầu cho công trình thương mại quy mô lớn, đặc biệt phù hợp nếu triển khai hệ thống multi cần độ ổn định cao giữa các dàn lạnh.

### FAQ

1. **Máy lạnh 6HP là bao nhiêu BTU?**
   68.000–70.000 BTU/h.
2. **Nên dùng 1 máy 6HP hay hệ thống multi cho nhà hàng 130m²?**
   Nếu không gian mở một khối, 1 máy 6HP tối ưu chi phí lắp đặt hơn; nếu chia nhiều khu chức năng riêng (bếp, phòng VIP, sảnh chính), hệ thống multi cho phép bật/tắt độc lập từng khu, tiết kiệm điện hơn khi không dùng hết không gian.

---

## 10HP — `may-lanh-10hp`

### Content

**Máy lạnh 10HP – công suất công nghiệp cho cửa hàng, kho xưởng 200–250m²**

Máy lạnh 10HP có công suất lạnh 96.000–120.000 BTU/h, phù hợp không gian lớn 200–250m², thường dùng cho cửa hàng/siêu thị mini, nhà xưởng sản xuất hoặc kho lưu trữ có yêu cầu kiểm soát nhiệt độ.

**Ở mức 10HP, việc lắp đặt không còn đơn giản như các công suất dân dụng thấp hơn** — cần khảo sát kết cấu trần/mái để xác định vị trí đặt dàn lạnh và đường ống gas phù hợp, xác nhận công suất điện 3 pha của toà nhà đáp ứng đủ, và với không gian sản xuất/kho, cần tính thêm tải nhiệt từ máy móc, số lượng nhân viên ra vào liên tục và tần suất mở cửa (đặc biệt với kho có cửa xuất/nhập hàng thường xuyên mở). Đây là công suất nên yêu cầu khảo sát thực địa trước khi báo giá, không nên chốt chỉ dựa trên diện tích.

**Thông số kỹ thuật máy lạnh 10HP**

| Thông số | Giá trị |
|---|---|
| Công suất lạnh | 96.000–120.000 BTU/h |
| Diện tích phòng phù hợp | 200–250 m² (tuỳ đặc thù không gian) |
| Công suất tiêu thụ điện (Inverter) | ~11.500–12.500 W định mức |
| Dòng điện định mức | 45–50 A |
| Nguồn điện | 3 pha |
| Loại dàn lạnh phổ biến | Áp trần công suất lớn hoặc hệ thống multi |

**Máy lạnh 10HP tốn bao nhiêu tiền điện mỗi tháng?**

Với không gian thương mại/sản xuất vận hành trung bình 10 tiếng/ngày (không phải 8 tiếng như các mức dân dụng), tiêu thụ trung bình thực tế khoảng 6.000–6.500W — tương đương **~1.900–2.000 kWh/tháng, khoảng 5.300.000–5.600.000đ/tháng**. Con số này chênh lệch lớn tuỳ giờ vận hành thực tế và tần suất mở cửa ra vào, nên xem là mức tham khảo ban đầu trước khi khảo sát cụ thể.

**Nên chọn máy lạnh 10HP hãng nào**

- **Daikin** — gần như là lựa chọn mặc định ở phân khúc công suất lớn cho công trình thương mại/công nghiệp tại Việt Nam, do độ ổn định đã được kiểm chứng qua nhiều dự án và khả năng hỗ trợ kỹ thuật dài hạn.

### FAQ

1. **Máy lạnh 10HP là bao nhiêu BTU?**
   96.000–120.000 BTU/h tuỳ model.
2. **Kho hàng có cửa xuất/nhập thường xuyên mở nên chọn công suất thế nào?**
   Nên khảo sát thực địa thay vì tính thuần theo diện tích — tần suất mở cửa liên tục làm thất thoát khí lạnh đáng kể, có thể cần công suất cao hơn mức lý thuyết hoặc bố trí thêm rèm/cửa ngăn khu vực xuất nhập.
