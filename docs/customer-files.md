# Tệp khách gửi kèm yêu cầu tư vấn (bản vẽ PDF/DWG/DXF, ảnh)

**Status:** Code xong 2026-11-06 (elc-go nhánh `feat/private-attachments`, elc-temp), chờ deploy. Các bước vận hành ở mục "Triển khai" phải làm đủ thì tính năng mới chạy.

## Vì sao có tài liệu này

Trước đây khách chỉ gửi được ảnh, và ảnh nằm trong bucket R2 **công khai** (ai có link đều xem được). Bản vẽ công trình của khách là dữ liệu nên giữ riêng. Tệp giờ nằm trong bucket **riêng** `elc-private`, không có URL công khai; nhân viên đăng nhập admin xem qua link tạm 5 phút.

## Luồng

```
Trình duyệt --(POST multipart)--> Next /api/inquiries/files --(stream)--> elc-go POST /inquiries/files
                                                                              | kiểm tra loại theo byte đầu
                                                                              v
                                                              R2 bucket riêng  inquiries/<yyyymm>/<128-bit>.<đuôi>
Gửi form: attachments = [{key,name,size,type}] --> elc-go Stat từng tệp (lấy size/type THẬT) --> lưu vào inquiries.attachments
Admin:    GET /inquiries/{id}/attachments/{index} --> link ký 5 phút (inline cho ảnh/PDF, tải xuống cho DWG/DXF)
```

## Quy tắc (giữ khớp giữa `elc-go/internal/inquiry/domain/attachment.go` và `modules/inquiry/domain/attachments.ts`)

| | |
|---|---|
| Loại nhận | PDF, DWG, DXF, JPG, PNG, WebP. **Nhận theo byte đầu của tệp**, không tin đuôi hay Content-Type khách gửi. ZIP/RAR/exe/HTML/SVG bị từ chối kể cả đổi đuôi thành `.pdf` |
| Kích thước | 15 MB mỗi tệp, tối đa 6 tệp và 30 MB mỗi lead |
| Tên tệp | Chỉ để hiển thị (đã bỏ đường dẫn, ký tự điều khiển, cắt 120 ký tự). Khóa lưu trữ do server sinh, khách không đặt được |
| Giới hạn tần suất | 10 tệp / 10 phút / IP, tối đa 4 tệp đang tải cùng lúc trên server (giữ RAM) |
| Lưu giữ | 12 tháng (rule của R2, xem dưới). Quá hạn: admin hiện "Tệp đã hết hạn" |
| Quét virus | **Không có** (nợ kỹ thuật, VPS hẹp). Admin không chạy tệp trên server; DWG/DXF chỉ tải về |
| HEIC | Không nhận (admin không xem được); iPhone thường tự đổi ảnh sang JPEG khi chọn từ thư viện |

`inquiries.attachments` (jsonb) chứa hai dạng: chuỗi URL (lead cũ, ảnh công khai) và object `{key,name,size,type}`. Đọc được cả hai; dòng cũ không bị đổi khi ghi lại. API danh sách **không bao giờ trả `key`**, chỉ `private:true`, tên, size, type.

## Triển khai (thứ tự quan trọng)

1. **Go** (`push main` elc-go). `deploy.yml` truyền `R2_PRIVATE_BUCKET_NAME`, `R2_PRIVATE_ACCESS_KEY_ID`, `R2_PRIVATE_SECRET_ACCESS_KEY` (secret đã có trên GitHub) cùng `R2_ACCOUNT_ID` dùng chung. Khi khởi động, server tự ghi-đọc-ký-xoá một tệp thử và ghi log: `private file store self-test passed` hoặc `... FAILED`. **Xem log này trước khi làm bước tiếp** (`docker logs elc-go | grep self-test`).
2. **nginx** (VPS, một lần): mặc định `client_max_body_size 10m` chặn tệp 10-15 MB. Chạy `deploy/nginx/add-upload-location.py <file site>` để thêm `location = /api/inquiries/files` cho 17m, rồi `nginx -t` và reload. Cũng cài lại `scripts/nginx-live/live.py` lên `/opt/elc/nginx-live/` (allowlist có thêm `inquiries/files`; thiếu thì nginx trả 410).
3. **FE** (`push main` elc-temp). Phải SAU bước 2, nếu không bước tải tệp báo lỗi.
4. **Cloudflare** (làm tay): bucket `elc-private` > Settings > Object lifecycle rules > xoá object có prefix `inquiries/` sau 365 ngày.
5. **Chính sách riêng tư** (trang `chinh-sach-thu-thap-va-xu-ly-du-lieu-ca-nhan`, sửa trong admin): thêm tệp đính kèm vào danh sách dữ liệu và thời gian lưu 12 tháng (đoạn gợi ý trong tin nhắn bàn giao).

## Cần biết

- `proxy.ts` loại `/api/inquiries/files` khỏi matcher: Next chặn/cắt body bị proxy ở 10 MB.
- Tệp của form bị bỏ dở vẫn nằm trong bucket tới hết 12 tháng như tệp đã gửi (không có bước dọn `pending/`; chuyển tệp sau khi tạo lead dễ để lead hỏng khi copy lỗi).
- Route cũ `POST /inquiries/uploads` (ảnh công khai) còn trong Go cho FE cũ trong lúc deploy; xoá ở bước contract sau khi FE mới đã chạy.
- **Rollback Go về bản cũ:** bản cũ không đọc được lead có tệp dạng object và sẽ lỗi khi tải danh sách lead. Chỉ rollback khi chưa có lead nào gửi tệp mới, hoặc rollback cùng bản sửa.
- Chi phí: R2 miễn phí 10 GB/tháng và không tính phí tải xuống; ở quy mô này gần như 0 đồng.
