# Fix: `generate_lead` và `view_item` không bao giờ lên GA4 — 2 hệ thống tracking song song không kết nối nhau

Status: Phần 1-2 Done (2026-09-08) — `shared/lib/gtag.ts` giờ push vào
`dataLayer` thay vì gọi `window.gtag`; đã xoá hẳn `GoogleAnalytics.tsx` (chọn
nhánh "Sạch hơn" ở mục 2 — file luôn render null vì `NEXT_PUBLIC_GA_ID` chưa
set, và `pageview()` không còn ai gọi) + nơi mount nó ở `app/layout.tsx`.
Verify bằng Playwright: mở trang project detail, xác nhận `window.gtag` là
`undefined` (không còn code chết gọi API không tồn tại), `window.dataLayer`
nhận đúng `{event: "view_item", items: [...]}`, không có console error. GTM
(`gtm.js`, `GTM-TQ9DL8CG`) vẫn là script tracking duy nhất load trên trang —
không có gtag.js nào bị load thêm. **Phần 3 (tạo trigger/tag mới trong GTM
UI) chưa làm — cần người có quyền Edit/Publish trên container, không phải
việc code.**

## Bối cảnh

Phát hiện trong lúc audit SEO/tracking: GA4 (property `542137830`, measurement
id `G-NQX12HH2XG`) 30 ngày gần nhất chỉ có các event:

```
page_view          675
session_start      327
first_visit        251
user_engagement    132
scroll              94
click_zalo          11
click                8
click_hotline        2
```

**Không có `generate_lead` — nghĩa là không đo được có bao nhiêu người bấm
gửi form tư vấn/đặt lịch**, dù `LeadForm`/`LeadFormScreen` được dùng ở cả 3
loại trang (product/project/service). Đây là conversion action quan trọng
nhất của cả site, đang hoàn toàn mù (dark) trên GA4.

## Nguyên nhân — 2 lớp, đã verify bằng code + GTM API

**Lớp 1 — code gọi API sai, sự kiện chết ngay trên trình duyệt:**

- `shared/lib/gtag.ts` implement `event()`/`pageview()` bằng cách gọi
  `window.gtag(...)` — đây là API của **gtag.js** (script riêng biệt).
- `shared/components/molecules/analytics/GoogleAnalytics.tsx` là nơi DUY NHẤT
  có thể load gtag.js thật (`<Script src="https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}">`),
  nhưng **chỉ render khi `process.env.NEXT_PUBLIC_GA_ID` có giá trị**
  (`GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID` trong `gtag.ts`).
  Verify: `grep -iE "GA_|GTM|MEASUREMENT" .env.local` → **không có dòng nào**.
  → Component luôn `return null`, gtag.js không bao giờ load, `window.gtag`
  không bao giờ tồn tại → mọi lệnh gọi `gtag.event(...)`/`gtag.pageview(...)`
  bị nuốt âm thầm bởi guard `if (!window.gtag) return;` — không lỗi, không
  log, không ai biết.

  3 call site đang chết theo cách này (verify bằng
  `grep -rn "gtag\.\(event\|pageview\)"`):
  - `modules/inquiry/presentation/components/LeadFormScreen.tsx:944` —
    `gtag.event("generate_lead", ...)` ← **quan trọng nhất, cần fix**
  - `modules/event/presentation/hooks/useTrackView.ts:23` —
    `gtag.event("view_item", ...)` ← nên fix cùng lúc
  - `shared/components/molecules/analytics/GoogleAnalytics.tsx:18` —
    `gtag.pageview(url)` ← xem phần "Không cần làm" bên dưới, KHÔNG fix cái
    này theo hướng bật lại gtag.js

**Lớp 2 — kể cả sửa code xong, GTM cũng chưa có nơi nhận:**

Site đang chạy tracking thật qua **Google Tag Manager** (`GTM-TQ9DL8CG`,
container `dienmayelc.com.vn`, account `6361451943` / container `255803754`)
— đây là hệ thống độc lập, không liên quan gì tới gtag.js/`shared/lib/gtag.ts`
ở trên. Đọc live container qua Tag Manager API xác nhận đúng 6 tag:

```
GA4 - Thẻ Google              (GA4 Configuration gốc, All Pages)
Google Ads - Conversion Linker
GA4 Event - Click Zalo        <- Custom trigger: Click URL chứa "zalo.me/0789978898"
GA4 Event - Click Hotline     <- Custom trigger: Click URL chứa "tel:0789978898"
GA4 Event - Click Messenger   <- Custom trigger: Click URL chứa "ELCdienmay"
GA4 Event - Click Mail        <- Custom trigger: Click URL chứa "mailto:..."
GA4 Event - Page View SPA     <- trigger: History Change (built-in GTM trigger)
```

**Không có trigger hay tag nào cho `generate_lead` hay `view_item`.** 2 hệ
thống (GTM và gtag.js-trong-code) được xây bởi 2 người/2 thời điểm khác nhau,
chưa bao giờ được nối lại.

## Vì sao KHÔNG chọn cách đơn giản nhất (set `NEXT_PUBLIC_GA_ID`)

Set biến env này sẽ load gtag.js thật, làm `window.gtag` tồn tại, code hiện
tại sẽ chạy được — NHƯNG lúc đó site có **2 nguồn gửi data về cùng 1
measurement id `G-NQX12HH2XG` song song**: gtag.js tự quản lý pageview riêng
+ GTM's "GA4 Event - Page View SPA" tag cũng tự bắn `page_view` qua History
Change trigger. Kết quả: đếm trùng `page_view`, làm sai lệch toàn bộ số liệu
traffic đang dùng để ra quyết định SEO. **Không làm theo hướng này.**

## Việc cần làm — gộp về 1 hệ thống, dùng GTM làm chính

### 1. Sửa `shared/lib/gtag.ts`

Đổi `event()` để push vào `dataLayer` thay vì gọi `window.gtag`:

```ts
export function event(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
}
```

Cân nhắc đổi tên file/export (vd `shared/lib/analytics.ts`) vì giờ không còn
liên quan gì tới "gtag" nữa — tên cũ sẽ gây hiểu lầm cho người đọc code sau
này. Không bắt buộc, tuỳ độ ưu tiên dọn dẹp lúc làm.

`pageview()` — xem mục "Không cần làm", không cần sửa hàm này, chỉ cần bỏ nơi
gọi nó.

### 2. Xoá lời gọi `gtag.pageview()` + cân nhắc xoá luôn `GoogleAnalytics.tsx`

`GoogleAnalytics.tsx` hiện luôn render `null` (vì `NEXT_PUBLIC_GA_ID` không
set) — giữ nguyên trạng thái này (không set biến env đó, không load gtag.js
thêm lần nữa), vì GTM đã tự lo phần pageview qua History Change trigger rồi.
2 lựa chọn, chọn 1:
- **Đơn giản**: để nguyên file, không set env var — component tiếp tục
  render null mãi mãi, coi như dead code vô hại.
- **Sạch hơn**: xoá hẳn `GoogleAnalytics.tsx` + nơi nó được mount (tìm bằng
  `grep -rn "GoogleAnalytics" app/`), xoá luôn `pageview()` khỏi
  `shared/lib/gtag.ts` vì không còn ai gọi.

Không quan trọng chọn nhánh nào, miễn KHÔNG set `NEXT_PUBLIC_GA_ID`.

### 3. Thêm cấu hình trong GTM (làm trên tagmanager.google.com, không phải code)

Người có quyền Edit/Publish trên container (`dev tranvu` hoặc `thehoangsa` —
xem danh sách quyền, service account chỉ có Read) cần vào container
`dienmayelc.com.vn` (GTM-TQ9DL8CG) → Workspace → tạo mới:

**Trigger mới #1** — Custom Event:
- Event name: `generate_lead`
- (Không cần điều kiện thêm, fire mọi lúc event này xuất hiện trên dataLayer)

**Trigger mới #2** — Custom Event:
- Event name: `view_item`

**Tag mới #1** — GA4 Event (type `gaawe`, giống 4 tag Click hiện có):
- Tag name: `GA4 Event - Generate Lead`
- Measurement ID: `G-NQX12HH2XG` (measurementIdOverride, giống pattern 4 tag
  click đang có)
- Event Name: `generate_lead`
- Event Parameters: map `lead_source` và `items` từ dataLayer (dùng Data
  Layer Variable cho từng key, đúng key code đang gửi ở
  `LeadFormScreen.tsx:944-947`: `lead_source`, `items`)
- Firing trigger: Trigger mới #1 ở trên

**Tag mới #2** — GA4 Event:
- Tag name: `GA4 Event - View Item`
- Event Name: `view_item`
- Event Parameters: map `items` từ dataLayer (đúng key ở
  `useTrackView.ts:23-25`)
- Firing trigger: Trigger mới #2 ở trên

Sau khi tạo xong, **Preview** để test trực tiếp trên site thật (mở trang
product/project/service, xem `view_item` fire; submit thử 1 form, xem
`generate_lead` fire trong GTM Preview panel) trước khi **Publish**.

## Không cần làm

- Không cần set `NEXT_PUBLIC_GA_ID` — xem lý do ở trên (double-count
  page_view).
- Không cần sửa gì ở GA4 property — GA4 tự nhận diện event name lạ, không
  cần khai báo trước ("Custom Event" trong GA4 tự động xuất hiện trong report
  sau khi có data, có thể đánh dấu là "Conversion" trong GA4 Admin sau khi
  thấy event đổ về, không cần làm trước).
- Không cần đụng vào `logEventAction` trong `useTrackView.ts` (dòng 15-20) —
  đó là pipeline nội bộ riêng của ELC (DB tự có, khác GA4), không liên quan
  bug này, đang chạy độc lập và không bị ảnh hưởng.

## Verify sau khi fix

1. Trên trình duyệt, mở DevTools Console tại 1 trang project/service bất kỳ
   → gõ `window.dataLayer` → phải thấy object `{event: "view_item", ...}`
   xuất hiện.
2. Điền và submit thử 1 form tư vấn (dùng số điện thoại test) → check
   `window.dataLayer` có `{event: "generate_lead", ...}`.
3. Trong GTM → Preview mode → xác nhận cả 2 tag mới fire đúng lúc.
4. Sau khi Publish, đợi ~30 phút-1 giờ → check GA4 → Realtime → Event count
   by Event name → thấy `generate_lead`/`view_item` xuất hiện.
5. Sau vài ngày có data thật: GA4 Admin → Events → đánh dấu `generate_lead`
   thành Conversion (bật toggle "Mark as conversion") để nó lên được báo cáo
   Conversions/Advertising — đây là bước quan trọng để dùng data này đo hiệu
   quả SEO/ads thật sự (bao nhiêu lead ra từ organic vs paid).
