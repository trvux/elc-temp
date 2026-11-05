# Chuyển hướng (redirect) 308

**Status:** Đã triển khai 2026-11-06. Nguồn dữ liệu duy nhất là bảng `redirects` trong DB; quản lý ở **/admin/redirects**.

## Cách hoạt động

```
Admin /admin/redirects ----+
                           v
   đổi slug của bài, sản phẩm, dịch vụ... ---> trigger SQL tự thêm dòng (source = auto)
                           |
                           v
                  bảng `redirects` (Postgres)
                           |
        mỗi 2 phút: scripts/nginx-live/live.py (systemd timer trên VPS)
                           v
        /etc/nginx/conf.d/elc-redirects.conf  (map $uri $elc_redir)
                           v
        nginx trả 308 trước cả allowlist 410 và trước Next.js
```

Hiệu lực sau tối đa 2 phút, không cần deploy. Mã trả về là **308** (vĩnh viễn, Google coi như 301).

## Việc thường làm

| Muốn | Làm |
|---|---|
| Đổi địa chỉ một trang | Sửa slug trong admin của trang đó. Chuyển hướng tự được tạo. Sau đó sửa các link nội bộ trỏ vào địa chỉ cũ (xem mục dưới) |
| Chuyển một địa chỉ cũ bất kỳ | /admin/redirects, "Thêm chuyển hướng" |
| Tạm tắt một chuyển hướng | Gạt công tắc "Bật" |
| Một địa chỉ cũ trả 410 mà muốn giữ | Thêm chuyển hướng cho nó (nginx trả 410 cho mọi đường dẫn không còn trong DB) |

## Quy tắc tự bảo vệ

- Chuỗi chuyển hướng được làm phẳng: A tới B, B tới C thì A tới C. Vòng lặp bị từ chối khi lưu.
- Đổi slug rồi đổi ngược lại không tạo vòng lặp: dòng cũ bị xóa.
- `live.py` bỏ qua (và ghi log) dòng có địa chỉ nguồn là **trang đang sống** (sẽ che mất trang), dòng có đích **không sống** (sẽ chuyển vào 410), và dòng bị vòng lặp.
- Nếu DB trả 0 chuyển hướng trong khi file cũ có hơn 50 dòng, `live.py` giữ file cũ thay vì xóa sạch.
- Ghi file, `nginx -t`, reload, kiểm tra trang chủ trả 200; sai thì khôi phục cả hai file.

## Sau khi đổi slug: sửa link nội bộ

Chuyển hướng giữ cho khách và Google không rơi vào 404, nhưng link nội bộ nên trỏ thẳng địa chỉ mới (đỡ một bước chuyển, đúng tín hiệu SEO). Link trong nội dung nằm trong JSON của `news.content`, `projects.description`, `services.content`, `pages.content`, `categories.content`.

## Chẩn đoán

```bash
ssh vps-elc 'journalctl -u elc-nginx-live -n 20 --no-pager'        # lịch sử các lần chạy, dòng "skipped redirect ..."
ssh vps-elc 'grep -c "\" \"" /etc/nginx/conf.d/elc-redirects.conf'  # số dòng đang áp dụng (mỗi quy tắc 2 dòng)
curl -sI https://dienmayelc.com.vn/duong-dan-cu | grep -i "^HTTP\|^location"
```

## Mã nguồn

| Phần | Vị trí |
|---|---|
| Module Go (domain, use-case, API `/admin/redirects`) | repo `elc-go`, `internal/redirect/` |
| Bảng và trigger | `internal/redirect/migrations/000001`, `000002` (chạy tự động khi deploy) |
| Giao diện admin | `modules/redirect/`, `app/(admin)/admin/(dashboard)/redirects/` |
| Sinh map nginx | `scripts/nginx-live/live.py` (`--redirects-out`), test: `python3 -m unittest scripts/nginx-live/test_live.py` |
| Nhập file cũ vào DB (đã chạy một lần) | `scripts/nginx-live/import_legacy_redirects.py` |
| Cài timer | `deploy/nginx/install-timer.sh` |

`scripts/nginx-live/redirects.py` và `shared/redirects-map.json` là nguồn cũ (sinh file tĩnh, cần chạy tay), không còn là nguồn sự thật.
