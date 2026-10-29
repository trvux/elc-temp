# Redesign: typography, utility, shadcn, component, trang (v3)

**Status:** DRAFT v3 (cập nhật 2026-10-29). Phần **typography** của kế hoạch này đã được thực hiện theo cách khác (strangler fig trong elc-temp, không phải nhánh `redesign`): xem `docs/typography-strangler-plan.md`. Các phần shadcn/Base UI/component/trang của v3 chưa làm.
**Thay thế** các bản v1/v2 (migration giữ pixel, ~350 dòng). Hai bản đó đã bị bỏ vì hiểu sai phạm vi: người dùng muốn **làm lại** cả hệ thống, không phải đổi cấu trúc mà giữ giao diện.

## Bối cảnh đã chốt
- Một người code (người dùng), traffic gần như bằng 0, nên rủi ro production thấp.
- Làm trên **một nhánh dài `redesign`** (cách a). `main` không bị đụng; chỉ merge khi xong toàn bộ.
- Xóa toàn bộ shadcn hiện tại (`shared/components/ui`, style `radix-vega`) và cài lại, vì đã chỉnh sửa quá nhiều dẫn tới sai.
- Phân công: Claude làm token/font/typography/utility rồi giải thích; người dùng tự code component và trang, Claude dẫn từng bước nhỏ. Mỗi lượt một khái niệm.

## Mặc định (đổi được nếu người dùng phản đối)
- Nền: **Base UI** (đồng nhất với elc-v2 đã `shadcn init (Base UI)`), thay Radix. Hệ quả: API khác (vd `asChild` -> `render`), ảnh hưởng 173 file import `ui/*`, nhưng dù sao cũng viết lại.
- Token và thiết kế gốc lấy từ **elc-v2** (đo từ apple.com): Inter, Geist Mono, màu OKLCH, light/dark/contrast.
- Admin: dựng lại **sau cùng** (sau public), vì xóa shadcn thì admin cũng hỏng tạm thời, chấp nhận trên nhánh `redesign`.

## Nguyên tắc còn giữ từ plan cũ
1. Class quyết định hình dạng (`type-*`), tag quyết định cấu trúc. Hai thứ độc lập.
2. Mỗi trang đúng một `<h1>`, do component tiêu đề trang sở hữu. Heading đầu tiên của tài liệu là `h1`. Không nhảy cấp. Header/nav/thanh dính không dùng heading.
3. Footer theo cấu trúc apple.com: `<footer aria-labelledby>` + một `h2` ẩn, một `<nav aria-label>`, tên nhóm là `h3`, danh sách `ul/li`.
4. `cn()` cấu hình `extendTailwindMerge` hai chiều cho `type-*`; cấm `type-*` đi cùng `text-<size>`/`font-<weight>`/`leading`/`tracking`.
5. Giữ nguyên text `h1` của các route hiện có khi dựng lại (bảo vệ công sức SEO đã làm).
6. Không đụng `.typeset`, JSON-LD, sitemap, llms.txt.

## Bước 0 (MỚI, làm trước mọi bước dưới): xác định cần xây gì
Dự án chưa từng có PRD, nên nhiều tính năng không ai dùng và không phục vụ mục tiêu thật: đưa mô hình kinh doanh lên điện tử để tối ưu marketing (SEO, GEO, AEO). Dựng lại UI cho cả 28 module khi chưa biết module nào cần là lặp lại đúng vòng cũ.
1. Product brief một trang: mục tiêu, các nhóm khách (4 vertical đã chốt trong memory), chỉ số thành công.
2. Kiểm kê tính năng kèm bằng chứng sử dụng (có ai dùng không, có phục vụ SEO/GEO/AEO hoặc lead không) -> giữ / xóa / hoãn.
3. Chỉ dựng lại phần "giữ". Kết quả của Bước 0 quyết định phạm vi của Bước 2 đến 5.
Typography/token ở elc-v2 (Bước 1) không phụ thuộc phạm vi nên vẫn tiếp tục song song.

## Các bước (mỗi bước xong và xác nhận mới sang bước sau)

**Bước 1: Typography, utility, token (ở elc-v2)** - Claude làm, giải thích.
- Bộ `type-*` đặt theo vai trò, số đo từ Apple, breakpoint Tailwind md/lg.
- Component `Heading` (level tách khỏi look), `cn()` + test.
- Chốt token màu/radius/font nếu cần chỉnh.

**Bước 2: Chuẩn bị elc-temp** (nhánh `redesign`)
- Tách code tự viết khỏi shadcn: `data-table`, `tiptap-editor`, `image-upload`, `tag-input`, `tag-multi-select`, `star-rating`, `stock-badge`, `title-align-field`, `social-icons`, `animate-in`, `badge-custom`... (chuyển sang thư mục riêng, không xóa).
- Xóa 24 file shadcn không ai import.
- Xóa phần còn lại của `ui/`, cài lại shadcn (nền theo mặc định ở trên), áp token từ Bước 1.
- Ghi nhận: site không build được cho tới khi các component được dựng lại.

**Bước 3: Dựng lại component** (cùng làm, người dùng tự code)
Thứ tự theo mức dùng: button (124 file) -> input/field/badge -> card/dialog/sheet/accordion/tabs -> component nghiệp vụ (`ProductDetailModule`, `ProductListModule`, `ServiceDetailModule`, `ProjectListModule`, `PageHero`, footer, header...). Mỗi component một commit.

**Bước 4: Dựng lại từng trang** (cùng làm)
Public trước, theo thứ tự đơn giản đến phức tạp, trang chủ cuối. Mỗi trang kiểm: một `h1`, heading đúng thứ tự, `bunx tsc --noEmit` và `bun run build` xanh.

**Bước 5: Admin**, rồi dọn, xóa `typography.tsx` cũ, cập nhật `docs/design-system.md`, đóng Status của tài liệu này.

## Kiểm tra tối thiểu cho mỗi bước
`bunx tsc --noEmit`, `bun run build` (không cần Go API), `vitest run` (chạy tay vì CI không chạy). Script đếm `h1`/thứ tự heading trên HTML dựng khi cần. Chỉ commit khi người dùng xác nhận.

## Việc mở
1. Người dùng có đồng ý hai mặc định: Base UI và admin làm sau cùng?
2. Thang `type-*` ở Bước 1 (đề xuất đã gửi trong hội thoại, chờ duyệt).
