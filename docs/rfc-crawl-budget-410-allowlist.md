# RFC: Crawl budget cleanup - nginx 410 allowlist

**Status:** Đã cài lên nginx production 2026-10-09 (allowlist 410 + chuẩn hoá URL). Timer refresh 2 phút đã chạy trên VPS. Còn mở: commit/deploy repo, theo dõi 2 tuần.

## Vấn đề

Googlebot crawl ~4k URL trong khi site chỉ có ~446 URL sống. Đo được (log nginx 15 ngày + GSC + DB):

- `public/sitemap-migration.xml` vẫn được submit trong GSC: 1.882 URL cũ, trong đó 1.265 chết,
  557 chỉ là redirect, 60 sống. Nguồn rò chính.
- 516 URL WP cũ bị Googlebot gõ lại, trả 308 rồi 404 (qua Next, có tra DB).
- Bot quét `.env`, `.git`, `wp-*`, `*.php`... chạy hết xuống Next.
- Log nginx 15 ngày: 420k request, **77.9k (18,5%) rơi vào URL không sống**: scanner 54k (`.env`, `wp-admin`,
  `index.php`), slug WP cũ ở root 13k, URL redirect cũ 6k (Googlebot 1.083, Petal 1.554, Dotbot 595, Bing 236),
  `/san-pham/*` chết 3,2k (Bing 785, Dotbot 756, Googlebot 374), `/tag/*/feed` 753, `/danh-muc/*` 252,
  `/category/*` 72, URL test (`/du-an/testing`, `/tin-tuc/title`), `/san-pham/null` (79).
- **`www.dienmayelc.com.vn` trả 200 cho toàn bộ site** (không redirect về apex): mọi URL tồn tại hai bản.
- Query string (`?brands=`, `?search=`, gclid) chủ yếu do người dùng/Ads; Googlebot chỉ 460/23k request: để nguyên.
- Link nội bộ KHÔNG phải nguồn rò: crawl 446 trang sống, 0 link tới URL chết.

## Thiết kế

Default-deny tại nginx. Chỉ URL trong allowlist mới được đi tiếp xuống Next; còn lại 410, không chạm Next/DB.

- `$elc_live`: 446 URL sống từ DB production (chưa xoá, đã publish) + route hạ tầng (whitelist cụ thể, không `/api/` mở).
- `$elc_redir`: 308 chỉ cho URL cũ từng có impression trong GSC mà đích cuối còn sống (đã giải chain).
- Tách 2 file: `elc-redirects.conf` (tĩnh, sinh khi deploy) và `elc-live.conf` (động, tự refresh từ DB trên VPS).

## Vòng review (rủi ro -> xử lý)

| # | Rủi ro | Xử lý |
|---|--------|-------|
| 1 | Nội dung mới publish bị 410 tới lần refresh sau | Timer 2 phút + chạy tay được; chấp nhận độ trễ tối đa 2 phút |
| 2 | DB lỗi/rỗng -> refresh sinh allowlist rỗng -> 410 hàng loạt trang thật (rất đắt, Google xoá index nhanh) | Refresh fail-safe: query lỗi, hoặc số URL < 85% bản trước, hoặc < 300 URL -> GIỮ cấu hình cũ, log lỗi |
| 3 | Config sai cú pháp làm sập nginx | Ghi file tạm, `nginx -t` bằng conf thật, mới `mv` + reload; lỗi thì giữ bản cũ |
| 4 | Chặn nhầm route hạ tầng (OG image, feed Merchant, verifier) | Replay 567 path từng 200 trong log vào nginx tạm: chỉ path đã chết bị 410 (22/23 đã 404, 1 là sitemap-migration) |
| 5 | `/api/` mở toang cho scanner | Chỉ cho đúng route có thật trong `app/api` |
| 6 | 410 bị Cloudflare cache | Chấp nhận (ngắn); cần biết để không hoảng khi vừa publish |
| 7 | Slug có dấu/unicode, `/` cuối, query string | `$uri` đã decode; sinh cả dạng có và không có `/` cuối; query không ảnh hưởng |
| 8 | Redirect trỏ tới đích đã chết | Gen giải chain, chỉ giữ khi đích cuối thuộc tập sống |
| 9 | Không rollback được | Backup conf cũ; rollback = gỡ 2 dòng `if` + reload |
| 11 | `www` trùng lặp toàn site | 301 `www` -> apex ở nginx, cùng đợt cài |
| 10 | Làm hỏng GSC (xoá nhầm sitemap) | Chỉ xoá đúng `sitemap-migration.xml`; 5 sitemap còn lại giữ nguyên |

## Các bước

1. Gen file cấu hình (done, test replay trên nginx tạm cổng 8099).
2. Gỡ `sitemap-migration.xml` khỏi GSC bằng service account, xoá file khỏi `public/`.
3. Cài lên nginx live: backup, copy conf, thêm 2 dòng `if` vào `location /`, `nginx -t`, reload.
4. Verify trên production: 446 URL sống phải 200, mẫu URL chết phải 410, sitemap 5 file vẫn 200.
5. Cài timer refresh trên VPS (cần người dùng xác nhận chạy).
6. Theo dõi 2 tuần: log nginx (410 theo Googlebot), GSC Crawl stats.

## Không làm

- Không dựng lại blog cũ (quyết định 2026-09).
- Không đụng link nội bộ (đã sạch).

## Chuẩn hoá URL (www, http, dấu `/` cuối) - đã áp dụng

Chuẩn Google (developers.google.com, "Consolidate duplicate URLs"): redirect server-side là tín hiệu canonical
mạnh nhất, 301 và 308 tác dụng như nhau, ưu tiên HTTPS; Google không quy định www/non-www hay có `/` cuối,
chỉ cần nhất quán. Dạng chuẩn của site (canonical, sitemap, GSC): `https://dienmayelc.com.vn/path`
(apex, https, không `/` cuối). Mọi biến thể về đó trong **1 hop** (trước đó tệ nhất 3 hop):

- `http(s)://www/*` và `http://apex/*` -> 301 thẳng về dạng chuẩn, đã bỏ `/` cuối (`$elc_noslash`).
- `https://apex/x/` -> 301 `/x` chỉ với path sống (`$elc_slash`, sinh cùng allowlist); path chết trả 410 luôn.
- Cloudflare cache 301 tới 4 giờ (`max-age=14400`): hop cũ có thể còn thấy tới khi hết hạn.
- Không làm: HSTS (tuỳ chọn, chưa cần), query string (Googlebot hiếm gặp, canonical đã xử lý).

## Vận hành

- Allowlist động: timer `elc-nginx-live` (2 phút) chạy `/opt/elc/nginx-live/live.py --db`; log `journalctl -u elc-nginx-live`.
  Từ chối áp dụng nếu DB lỗi, <300 URL hoặc <85% bản trước; canary trang chủ sau reload, lỗi thì khôi phục (đã test guard).
  Trang mới publish có thể 410 tối đa ~2 phút; 410 gắn `Cache-Control: no-store` nên không bị cache.
- Redirect tĩnh (`elc-redirects.conf`, 605 cái, chỉ cây sản phẩm/dự án/chi nhánh có đích tương đương; mọi URL blog cũ, hub, mã lỗi = 410):
  thêm redirect mới ở `next.config.ts` KHÔNG đủ, phải sinh lại bằng `scripts/nginx-live/redirects.py` rồi chạy `install.sh`.
- Thêm route cấp 1 mới trong Next: phải thêm vào `INFRA` trong `scripts/nginx-live/live.py`, nếu không sẽ bị 410.
- Gỡ: `systemctl disable --now elc-nginx-live.timer`; rollback nginx: `cp /root/nginx-backup-*/site.orig ...`.

## Số liệu GSC Crawl stats (2026-07-11 -> 2026-10-06, 90 ngày)

38.227 request (~425/ngày), chỉ host `dienmayelc.com.vn`. Phản hồi: 200 80%, 301 16%, 404 4%. Mục đích: làm mới 92%, khám phá 8%.
Thời gian phản hồi TB 1,2-2,5s. Đo trực tiếp: HTML trang chủ 2,7MB, /san-pham 1,5MB, group 1,4-1,6MB, TTFB 0,9-2s, Cloudflare BYPASS.
=> Link chết chỉ chiếm ~20% request; đòn bẩy lớn hơn của crawl là trọng lượng HTML và TTFB (Phase 1 homepage).
