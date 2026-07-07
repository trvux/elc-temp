# SEO Redesign — Audit & Priority

> Tổng hợp toàn bộ vấn đề đã tìm thấy trong code (không suy đoán, mỗi mục đều trỏ vào file:line cụ thể),
> sắp xếp theo mức độ ưu tiên để build lại hệ thống SEO theo chuẩn ngành (tham chiếu Shopify/Contentful).
> Bối cảnh: 6 tháng SEO theo cách tự làm không hiệu quả (gần như 0 traffic), quyết định làm lại từ đầu.
>
> **Trạng thái: đã xong toàn bộ P0-P3.** Chỉ còn P2 (#7, #8) cần mày tự check Google Search Console,
> và P4 (#11) — dọn dẹp nhỏ không gấp.

---

## P0 — Bug đang phá crawl/index — ✅ Xong toàn bộ

### 1. ✅ `lastmod` trong sitemap luôn = "bây giờ" → Google mất niềm tin vào tín hiệu freshness
- **File**: [app/sitemap/products.xml/route.ts](../app/sitemap/products.xml/route.ts), [posts.xml](../app/sitemap/posts.xml/route.ts), [categories.xml](../app/sitemap/categories.xml/route.ts), [pages.xml](../app/sitemap/pages.xml/route.ts), [sitemap.xml/route.ts](../app/sitemap.xml/route.ts) (index).
- **Đã làm**: mỗi URL giờ dùng `updatedAt` thật của entity qua helper dùng chung [shared/lib/sitemap-lastmod.ts](../shared/lib/sitemap-lastmod.ts) (tự fallback về "now" chỉ khi giá trị không hợp lệ, tránh route crash). Route/entity không có khái niệm "cập nhật" (trang tĩnh, district hub) thì bỏ hẳn `<lastmod>` thay vì giả. Verify: `next build` + `next start` thật, thấy timestamp thật trong output.

### 2. ✅ `/san-pham?brands=X` — tín hiệu tự mâu thuẫn
- **File**: [app/(public)/san-pham/page.tsx](<../app/(public)/san-pham/page.tsx>)
- **Đã làm**: đổi biến thể `?brands=` sang `robots: { index: false, follow: true }` (giống biến thể `?search=`), bỏ `alternates.canonical` sai. Trang brand hub thật `/san-pham/{brand-slug}` đã tồn tại và index (docs/SITEMAP.md §3), nên querystring filter này là bản trùng ý định.
- **Phát hiện thêm cùng lúc**: `serviceLocationRoutes` (`/dich-vu/[slug]/[location]`, noindex theo docs/SITEMAP.md §4) vẫn bị đưa vào `pages.xml` sitemap, lãng phí crawl budget. **Đã xoá** khỏi [pages.xml/route.ts](../app/sitemap/pages.xml/route.ts), verify bằng curl thật.

### 3. ✅ Google Indexing API bị dùng sai mục đích — xoá hẳn
- Phát hiện **3 nơi độc lập** gọi `google.indexing().urlNotifications.publish` cho trang thường (chỉ chính thức hỗ trợ `JobPosting`/`BroadcastEvent`, Google trả 200 OK nhưng không index gì thêm): `shared/lib/google-indexing.ts` (gọi từ 4 module), endpoint mồ côi `app/api/indexing/products/route.ts` (không UI nào gọi), và `triggerGoogleIndexingAction` trong `catalog/presentation/actions.ts` (có nút "Gửi Google Index" trong admin báo thành công giả).
- **Đã xoá** cả 3 nơi + nút admin + endpoint + file `google-indexing.ts`. Giữ `submitToIndexNow` (hoạt động thật cho Bing/Yandex). Verify: `next build` route list không còn `/api/indexing/products`.

---

## P1 — Nền tảng "chuẩn ngành" — ✅ Xong toàn bộ (catalog/news/project/service)

### 4. ✅ Model dữ liệu SEO — object dùng chung thay vì cột rời rạc
- **Đối chiếu ngành**: Shopify dùng 1 type `SEO { title, description }` nhúng vào mọi resource; Contentful dùng 1 content type "SEO" riêng.
- **Đã làm — cả 3 tầng, cho 4 module (catalog/news/project/service)**:
  1. **DB**: migration `add_seo_column` áp dụng lên **production DB** — cột `seo JSONB NOT NULL DEFAULT '{}'` thêm song song với `meta_title`/`meta_description` cũ, backfill xong, verify bằng psql (`elc-go/internal/{catalog,news,project,service}/migrations/000002_add_seo_column.{up,down}.sql`).
  2. **Go backend**: domain/repository/DTO/handler của cả 4 module đọc/ghi field `seo` — theo đúng quy trình 8 bước đã dùng cho các module trước (audit → domain → migration → application → infrastructure → presentation). Verify: `go build`/`go vet` (cả tag `integration`) sạch toàn repo, `go test -tags=integration` chạy thật trên production DB PASS (tự dọn dữ liệu test).
  3. **elc-tem**: `seo` wire vào domain types, Zod schema, action layer, và các hàm build metadata — ưu tiên `seo.title`/`seo.description`/`seo.noindex`, fallback `metaTitle`/`metaDescription` cũ.
- **✅ Sửa lại thật (không phải chỉ patch thứ tự ưu tiên nữa)**: `generateProductMetadata`, `generateCategoryMetadata`, `generateBrandMetadata`, `generateServiceMetadata`, `generateProjectTypeMetadata`, `generateProjectDetailMetadata`, `generateSystemPageMetadata`, và `generateMetadata` của tin-tuc — **8 hàm từng tự lặp lại y hệt đoạn code build `Metadata` object** (canonical/OpenGraph/Twitter/robots, ~15-20 dòng mỗi hàm) giờ dùng chung đúng 1 hàm [`assembleMetadata()`](../shared/lib/seo-utils.ts) (mỗi hàm chỉ còn tính `title`/`description` theo kiểu nội dung riêng — phần này **cố ý không gộp** vì fallback copy của sản phẩm (brand+SKU+HP) và tin tức là 2 bài toán khác nhau thật sự, không phải trùng lặp cẩu thả). Đây mới là phần trả lời đúng câu hỏi "1 hàm resolveSeoMeta() dùng chung" đã hứa ở bản kế hoạch đầu — bản trước chỉ thêm `seo?.title ||` vào từng hàm cũ, chưa gộp thật.
- **Bug thật tìm ra trong lúc gộp, đã fix**: `generateServiceMetadata` cho biến thể `/dich-vu/[slug]/[location]` trước đó set cứng `robots: {index: true}` — nghĩa là trang doorway-page này **đang được index** dù cùng loại `/san-pham/[slug]/[location]` đã bị `noindex` đúng theo chính sách trong docs/SITEMAP.md §4. Giờ đã đồng nhất — verify bằng curl thật: cả 2 loại `[slug]/[location]` đều trả `noindex, follow`.
- **Chưa làm** (không gấp): xoá cột `meta_title`/`meta_description` cũ — để tới khi chắc chắn không còn nơi nào đọc trực tiếp cột cũ.

### 5. ✅ Self-serve admin panel
- Form admin Sản phẩm/Tin tức/Dự án/Dịch vụ có ô "Tiêu đề SEO"/"Mô tả SEO" (đếm ký tự 70/160) + checkbox "Ẩn khỏi kết quả tìm kiếm (noindex)" + **preview snippet Google trực tiếp trong form** ([shared/components/layout/admin/seo-snippet-preview.tsx](../shared/components/layout/admin/seo-snippet-preview.tsx)) — nhân viên thấy ngay tiêu đề/mô tả sẽ hiện thế nào trên Google trước khi lưu.
- **Trang "Kiểm tra SEO" mới** (`/admin/seo-audit`, [seo-audit-panel.tsx](../shared/components/layout/admin/seo-audit-panel.tsx)): quét toàn bộ sản phẩm/tin tức/dự án/dịch vụ đã publish, báo: thiếu mô tả SEO, tiêu đề quá dài, mô tả quá dài, mô tả trùng giữa 2+ trang, đang bật noindex — kèm link đi tới trang quản lý tương ứng.

### 6. ✅ Domain hardcode rải rác
- `"https://dienmayelc.com.vn"` từng lặp lại ở 25+ file. **Đã gộp** về 1 nguồn [shared/lib/seo-schema.ts](../shared/lib/seo-schema.ts)'s `BASE_URL` (đọc `NEXT_PUBLIC_APP_URL` trước, fallback hardcode sau). Verify: `grep -rl "dienmayelc.com.vn"` chỉ còn đúng 1 chỗ (định nghĩa fallback) + 2 chỗ dùng subdomain CDN khác (`media.dienmayelc.com.vn`, ngoài phạm vi).

---

## P2 — Cần check ngoài code (Search Console), không sửa được bằng code

### 7. Chưa xác nhận domain đã verify Google Search Console
- Trong code chỉ thấy file verify Zalo, không thấy verify Google (có thể đã verify qua DNS — **cần mày tự xác nhận**).
- Vào GSC → Coverage/Performance xem đã index bao nhiêu trang, impression bao nhiêu: 0 impression = vấn đề kỹ thuật; có impression nhưng 0 click = vấn đề content/cạnh tranh từ khoá.
- Vào GSC → Settings → Crawl Stats xem response time trung bình + tỷ lệ lỗi 5xx.

### 8. "Đã index nhưng search từ khoá dài không lên" — bình thường, không phải bug
- Index ≠ ranking. Kiểm tra đúng cách là GSC Performance lọc theo URL, không phải gõ tay vào ô search.

---

## P3 — Kiến trúc/hiệu năng — ✅ Xong

### 9. ✅ Audit `"use client"` — kết quả: KHÔNG có vấn đề thật
- Đếm lại chính xác: trong số ~40 file `"use client"` ở `app/(public)` + `modules/*/presentation`, phần lớn là component **chỉ dùng trong `/admin`** (Management/Columns/form tabs) — không liên quan SEO vì `/admin/` đã bị chặn crawl (`robots.ts`).
- Phần thật sự public (~10 file: filter widget, search input, lead form, scroll behavior, analytics tracking) đều **nhận data qua props** từ Server Component cha, không tự fetch (`useEffect`/`useQuery`) — nội dung vẫn nằm trong HTML server-render ban đầu, Google "wave 1" đọc được bình thường. Các trang chi tiết quan trọng nhất (`ProductDetailModule`, `ProjectListModule`, v.v.) xác nhận **không** phải `"use client"`.
- Kết luận: lo ngại ban đầu không thành sự thật với codebase này — không cần sửa gì.

### 10. ✅ Cache warming chủ động
- **Đã làm**: [shared/lib/cache-warm.ts](../shared/lib/cache-warm.ts) — sau mỗi lần tạo/sửa sản phẩm, tin tức, dự án, dịch vụ (đã publish), bắn 1 request nền tới đúng URL trang đó ngay sau khi `revalidateTag` để Next.js dựng lại cache **ngay lập tức** thay vì đợi khách/Googlebot ghé đầu tiên mới kích hoạt (đúng nguyên nhân gây "20s đầu chậm"). Wire vào 9 chỗ tạo/sửa/toggle-publish trong 4 module.

---

## P4 — Dọn dẹp nhỏ, không gấp

### 11. File `sitemap.xml` (78KB) nằm ở root repo, không nằm trong `public/` hay `app/`
- Không được serve ở đâu, có vẻ là file tải về để debug (Jun 17). Xác nhận với mày trước khi xoá.

---

## Tổng kết những gì đã làm

**Bug fix (P0)**: fix `lastmod` giả, xoá noindex combo khỏi sitemap, fix mâu thuẫn canonical `/san-pham?brands=`, xoá hoàn toàn Google Indexing API dùng sai.

**Nền tảng (P1)**: gộp domain hardcode về 1 nguồn; field `seo` JSONB thống nhất trên production DB cho 4 module (catalog/news/project/service) — DB → Go backend → elc-tem action layer → metadata generator → form admin (title/description/noindex + đếm ký tự + preview snippet Google); trang "Kiểm tra SEO" tổng hợp cảnh báo toàn site.

**Kiến trúc (P3)**: xác nhận `"use client"` không phải vấn đề thật (đã audit kỹ, không cần sửa); thêm cache warming chủ động sau mỗi lần admin lưu bài.

**Verify đã chạy**:
- elc-go: `go build`, `go vet` (cả tag `integration`) sạch toàn repo; `go test` (unit) PASS; `go test -tags=integration` cho cả 4 module chạy thật trên **production DB**, PASS, tự dọn dữ liệu test.
- elc-tem: `tsc --noEmit` sạch, `next build` pass toàn bộ route (kể cả `/admin/seo-audit` mới), `next start` + curl xác nhận trang sản phẩm/dịch vụ thật render đúng title/description từ field `seo`.

**Việc còn lại, ngoài khả năng của code**: P2 (#7, #8) — cần mày tự vào Google Search Console check impression/coverage/crawl stats để xác nhận có phải vấn đề kỹ thuật hay không.
