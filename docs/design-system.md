# Design System — Chuẩn UI/UX

Chuẩn bắt buộc cho mọi component UI trong repo này. Áp dụng khi viết mới **và** khi chuẩn hoá lại code cũ. Không tuân theo → yêu cầu sửa lại trong review.

## 1. Ba tầng component (atomic design)

Cấu trúc vật lý thật (không chỉ là quy ước đặt tên):

```
shared/components/
  ui/           # ATOMS — shadcn primitives nguyên bản, KHÔNG SỬA
  molecules/    # composition nhỏ, tái dùng, không gắn business logic
    motion-primitives/  effects/  auth/  analytics/
  organisms/    # section/layout gắn domain, có state/business logic
    sections/   layout/admin/   layout/user/
  theme-provider.tsx   # app-level infra, không thuộc 3 tầng trên
```

- **Atom** = `shared/components/ui/*`. Đây là output của `npx shadcn add`. Không được sửa file trong `ui/` — cần biến thể thì tạo molecule bọc ngoài, dùng `cva`/`className` compose, không đổi file gốc.
- **Molecule** = ghép 2–5 atom thành 1 unit tái dùng được ở nhiều nơi, không biết gì về domain (không import từ `modules/*`). Ví dụ: `password-checklist`, `spotlight`, `in-view`.
- **Organism** = có domain logic, gọi API/action, biết về `modules/*`. Ví dụ: `header`, `footer`, `wishlist-dialog`, `hero`.
- Trong `modules/*/presentation/components/`: cùng nguyên tắc — component nhỏ dùng lại trong module thì tách riêng thay vì nhét hết vào 1 file trăm dòng; không cần tạo subfolder atoms/molecules/organisms trong module (module đã là 1 domain boundary rồi), chỉ cần tách theo trách nhiệm đơn lẻ.
- Component mới cần primitive chưa có → `npx shadcn add <name>` trước, không tự viết tay bản thay thế.

## 2. 4pt grid — spacing bắt buộc theo thang Tailwind

Cấm tuyệt đối: `className="p-[11px]"`, `gap-[6px]`, `m-[1.5rem]`, `top-[3px]`, `w-[420px]`... Mọi spacing/size phải là token Tailwind sẵn có (bội số của 4px), map:

| px    | Tailwind  | px    | Tailwind |
|-------|-----------|-------|----------|
| 4px   | `1`       | 32px  | `8`      |
| 8px   | `2`       | 40px  | `10`     |
| 12px  | `3`       | 48px  | `12`     |
| 16px  | `4`       | 64px  | `16`     |
| 20px  | `5`       | 80px  | `20`     |
| 24px  | `6`       | 96px  | `24`     |

Số lẻ không tròn 4px (11px, 13px, 15px, 3px, 5px, 7px...) → làm tròn tới bội số 4 **gần nhất** khi chuẩn hoá (11px gần 12px hơn 8px → dùng `3`), không giữ nguyên bằng arbitrary value. Nếu một chỗ *thực sự* cần giá trị không tròn (icon 18px để căn với line-height chữ chẳng hạn) thì mới dùng arbitrary value, và phải là ngoại lệ có lý do, không phải mặc định.

Riêng **font-size** (kể cả khi viết dạng `text-[11px]`) không tra bảng này — theo thang chữ ở mục 3 (`text-xs`...), không quy về đơn vị spacing.

**Ngoại lệ hợp lệ** (không phải spacing, không bị cấm): màu theo CSS variable (vd `bg-[var(--brand-500)]`), giá trị tính toán động (`w-[calc(100%-2rem)]` khi thật sự cần), z-index hiếm khi cần số cụ thể ngoài thang chuẩn.

> Lưu ý viết ví dụ Tailwind trong doc: Tailwind v4 tự quét toàn bộ project kể cả file `.md` để tìm class candidate. Ví dụ arbitrary-value trong doc phải là class **hoàn chỉnh, thật**, không để dấu ba chấm thay cho phần chưa điền bên trong cặp ngoặc vuông — chuỗi dở dang đó có thể bị scan thành 1 utility class và sinh CSS lỗi, từng gây `next dev` crash (xem RFC §7 log 2026-08-18).

## 3. Font size / line-height

Dùng thang chữ Tailwind (`text-xs` → `text-4xl`), không dùng `text-[13px]`. Cỡ chữ tuỳ ý ngoài thang chỉ chấp nhận khi khớp pixel-perfect với design đã duyệt (hiếm).

## 4. Radius & màu — luôn dùng token, không hex/px tay

- Radius: `rounded-sm/md/lg/xl/2xl` (map theo `--radius-*` trong `globals.css`), không `rounded-[6px]`.
- Màu: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`... Không dùng `bg-[#fff]`, `text-[#666]`, không dùng bảng màu Tailwind thô (`bg-zinc-800`) cho surface nền tảng — chỉ token theo `@theme` trong `globals.css`.

## 5. shadcn — quy tắc cứng

- Không sửa trực tiếp file trong `shared/components/ui/`. Cần custom → bọc bằng molecule, hoặc thêm `cva` variant mới *thêm vào* (không đổi variant có sẵn) nếu thật sự phải sửa gốc (hiếm, cần lý do rõ).
- Không viết `<button>`, `<input>`, `<select>` thô khi đã có `Button`, `Input`, `Select` trong `ui/`.
- Component thiếu → `shadcn add`, không tự chế lại.
- `components.json` (`aliases.ui = "@/shared/components/ui"`) là nguồn sự thật cho vị trí atom — không đổi.

## 6. Density — chọn 1 kiểu / trang, không trộn

- **Comfortable** (trang user-facing, marketing): `gap-6` / `p-6` / `text-sm`.
- **Compact** (bảng admin, form dày đặc): `gap-4` / `p-4` / `text-sm`.
Không lẫn 2 kiểu trong cùng 1 page.

## 7. Quy trình chuẩn hoá 1 file cũ

1. Xác định file thuộc tầng nào (atom có sẵn / molecule / organism) — di chuyển đúng chỗ nếu sai (dùng move + sửa import repo-wide, không copy-paste).
2. Thay mọi arbitrary px/rem bằng token bảng ở mục 2.
3. Thay raw HTML element bằng shadcn primitive tương ứng nếu có.
4. Thay hex màu / Tailwind palette thô bằng token ở mục 4.
5. `npx tsc --noEmit` + `npm run build` để xác nhận không vỡ import/type.

## 8. Công cụ an toàn khi move/refactor file

`madge` đã cài (`pnpm add -D madge`). Trước và sau khi move file giữa atoms/molecules/organisms:

```bash
pnpm graph:circular   # phải luôn ra "No circular dependency found!"
pnpm graph:orphans    # review thủ công — page.tsx/layout.tsx/route.ts trong app/ sẽ luôn hiện "orphan" (đúng, vì Next tự route tới, không ai import) — không phải orphan thật
```

Đổi đường dẫn (`@/shared/components/...`) dùng `sed` thay thế chuỗi chính xác trên danh sách file lấy từ `grep -rl`, không tay đổi từng file — rồi luôn chạy `npx tsc --noEmit && npm run build` để xác nhận.

## 9. Trạng thái hiện tại (2026-08-18)

- `shared/components/` đã tách 3 tầng atoms/molecules/organisms (di chuyển xong, import đã cập nhật, build sạch).
- Danh sách file còn tồn (arbitrary px/rem trong `modules/*`/`app/*`, tách nhỏ thêm trong `organisms/`) + tiến độ theo checklist → xem [`docs/rfc-ui-ux-standardization.md`](./rfc-ui-ux-standardization.md), không lặp số liệu ở đây để tránh lệch khi có file được dọn xong.
