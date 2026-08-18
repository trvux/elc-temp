# RFC: Chuẩn hoá UI/UX (atomic design + 4pt grid)

- **Status:** Đang thực hiện (Phase 0 done, Phase 1 chưa bắt đầu — đã chia batch cụ thể ở §5a, sẵn sàng chạy bất cứ lúc nào)
- **Owner:** solo dev
- **Đọc thêm:** [`docs/design-system.md`](./design-system.md) — chuẩn/luật. File này (RFC) là **quyết định + tiến độ + kế hoạch**, không lặp lại nội dung luật.
- File này là nguồn sự thật để 1 phiên Claude mới đọc và biết chính xác cần làm gì tiếp — cập nhật checklist mỗi khi xong 1 phần, không cần hỏi lại "còn gì chưa làm".

## 1. Vấn đề

Codebase được AI viết code qua nhiều đợt, không có chuẩn cố định → lúc thì `p-[11px]`, lúc thì `p-3`; lúc dùng đúng shadcn, lúc raw HTML; `shared/components/` không phân biệt được đâu là primitive tái dùng (nút, icon) với đâu là section gắn business logic (header, wishlist dialog) — tất cả nằm chung 1 tầng phẳng. Không có chuẩn thì mỗi lần sửa lại thêm 1 kiểu mới, khoảng cách càng lúc càng xa.

## 2. Quyết định

1. **Atomic design thật (physical, không chỉ quy ước tên)** trong `shared/components/`: `ui/` (atoms, không sửa) → `molecules/` → `organisms/`. Trong `modules/*`, giữ nguyên cấu trúc DDD hiện có (`domain/presentation/components`), chỉ áp nguyên tắc "tách component nhỏ theo trách nhiệm đơn", không tạo thêm layer atoms/molecules/organisms trong module.
2. **4pt grid**: mọi spacing/size quy về thang Tailwind (bội số 4px), cấm arbitrary value (`[11px]`) trừ ngoại lệ có lý do rõ.
3. **shadcn base, không sửa root**: `shared/components/ui/*` là output của `shadcn add`, không đổi file gốc; thiếu gì thì `add` thêm, không tự viết lại.
4. **Công cụ an toàn**: `madge` (`pnpm graph:circular` / `pnpm graph:orphans`) chạy trước/sau mỗi lần move file, cộng `tsc --noEmit` + `next build` để xác nhận không vỡ.
5. **Rollout opportunistic, không sprint cố định**: không dừng cả app để dọn 1 lần. Module nào đang/sắp sửa thì chuẩn hoá theo luôn (xem mục 5). Lý do: rủi ro thấp hơn (đổi ít, verify dễ), không chặn việc khác, và đây là 1-người-làm nên không cần điều phối nhiều dev song song.

Chi tiết luật (bảng map px→Tailwind, quy tắc màu/radius/density...) → xem `docs/design-system.md`.

## 3. Đã xong — Phase 0: `shared/components/` restructure (2026-08-18)

- [x] Move `sections/`, `layout/` → `organisms/`; `motion-primitives/`, `effects/`, `auth/`, `analytics/` → `molecules/`; `ui/` giữ nguyên vị trí.
- [x] Sửa import ở 57 file dùng path cũ (sed theo alias, không tay từng file) + 2 comment stale.
- [x] Verify: `tsc --noEmit` sạch, `next build` compile sạch tất cả route, `pnpm graph:circular` → không có circular dependency.
- [x] Cài `madge`, thêm script `graph:circular` / `graph:orphans` vào `package.json`.
- [x] Viết `docs/design-system.md`.
- **Chưa commit** — đang chờ review diff.

## 4. Còn lại — inventory

### 4a. Tách nhỏ hơn `organisms/layout/user/` (một số file thực ra là molecule)

Các file sau là nút/widget nhỏ, không mang nhiều business logic tự thân riêng biệt (dù có gọi action), nên khi đụng tới thì cân nhắc chuyển xuống `molecules/`. Không bắt buộc làm ngay — chỉ làm khi đang sửa file đó vì lý do khác, tránh move-chỉ-để-move:

- [ ] `scroll-to-top.tsx`
- [ ] `top-progress-bar.tsx`
- [ ] `theme-theme-watcher.tsx`
- [ ] `wishlist-button.tsx`, `compare-toggle-button.tsx`, `compare-link-button.tsx`, `buy-now-button.tsx`, `order-button.tsx`
- [ ] `highlighted-text.tsx`, `expandable-content.tsx`

Giữ nguyên ở `organisms/` (đúng chỗ, có business logic/state rõ): `header/`, `footer.tsx`, `wishlist-dialog.tsx`, `compare-tray.tsx`, `filtered-grid-wrapper.tsx`, `product-search*`, `category-sections-grid.tsx`, `recently-viewed-section.tsx`, `related-services.tsx`, `product-description.tsx`, `product-floating-bar.tsx`, `detail-pager.tsx`, `info-toc.tsx`, `preview-content.tsx`.

### 4b. Arbitrary px/rem ngoài `shared/components/` — 41 file

Chuẩn hoá theo quy trình 5 bước ở `docs/design-system.md` §7. Nhóm theo pattern lặp lại đã thấy khi audit — biết trước để đỡ mất công đoán lại mỗi lần:

- **Table column width** (`w-[160px]` kiểu) trong các file `*Columns.tsx` — hầu hết đã tròn bội số 4, chỉ đổi `w-[160px]` → `w-40` theo bảng map, không cần suy nghĩ nhiều.
- **Font size nhỏ** (`text-[10px]`, `text-[11px]`) trong các file `*Management.tsx` — quy về `text-xs` (12px) theo §3, chấp nhận lệch 1-2px vì đây là size không có trong thang chữ chuẩn.
- `min-h-[80px]` kiểu — đổi thẳng theo bảng map (80px = `20`).

Danh sách file (check khi xong):

**Admin CRUD (`*Columns.tsx` / `*Management.tsx`)** — pattern lặp, sửa nhanh:
- [ ] `modules/admin-users/presentation/components/UsersColumns.tsx`
- [ ] `modules/attribute-definition/presentation/components/AttributeDefinitionManagement.tsx`
- [ ] `modules/author/presentation/components/AuthorColumns.tsx`, `AuthorManagement.tsx`
- [ ] `modules/branch/presentation/components/BranchColumns.tsx`, `BranchList.tsx`, `BranchManagement.tsx`
- [ ] `modules/brand/presentation/components/BrandColumns.tsx`, `BrandManagement.tsx`
- [ ] `modules/category/presentation/components/CategoryManagement.tsx`, `columns.tsx`
- [ ] `modules/contact/presentation/components/ContactManagement.tsx`
- [ ] `modules/dashboard/presentation/components/DashboardOverview.tsx`
- [ ] `modules/group/presentation/components/columns.tsx`, `GroupManagement.tsx`
- [ ] `modules/hp-page/presentation/components/HpPageColumns.tsx`, `HpPageManagement.tsx`
- [ ] `modules/inquiry/presentation/components/InquiryManagement.tsx`, `LeadForm.tsx`
- [ ] `modules/news/presentation/components/NewsColumns.tsx`, `NewsManagement.tsx`
- [ ] `modules/page/presentation/components/PageManagement.tsx`
- [ ] `modules/product-line/presentation/components/ProductLineManagement.tsx`
- [ ] `modules/project-type/presentation/components/columns.tsx`, `ProjectTypeManagement.tsx`
- [ ] `modules/project/presentation/components/ProjectColumns.tsx`, `ProjectManagement.tsx`
- [ ] `modules/review/presentation/components/ReviewColumns.tsx`, `ReviewFormSheet.tsx`
- [ ] `modules/service-group/presentation/components/ServiceGroupColumns.tsx`, `ServiceGroupManagement.tsx`
- [ ] `modules/service/presentation/components/ServiceColumns.tsx`, `ServiceManagement.tsx`
- [ ] `modules/shipping-zone/presentation/components/ShippingZoneManagement.tsx`
- [ ] `modules/system-page/presentation/components/SystemPageColumns.tsx`, `SystemPageManagement.tsx`
- [ ] `modules/tag/presentation/components/TagColumns.tsx`

**Public-facing (app/, module public component)**:
- [ ] `app/(public)/layout.tsx`
- [ ] `app/(public)/thong-tin/page.tsx`
- [ ] `app/(public)/tin-tuc/[slug]/page.tsx`
- [ ] `modules/project/presentation/components/public/ProjectFilterMobile.tsx`

### 4c. Raw HTML thay vì shadcn primitive

Quét trước đó chỉ thấy 2 file còn `<button>/<input>/<select>` thô — chưa xác định file cụ thể, cần quét lại lúc bắt tay làm phase này (`grep -rlE "<button[ >]|<input[ >]|<select[ >]" --include="*.tsx" shared modules app | grep -v /ui/`).

## 5. Cách thực hiện phần còn lại (cho phiên Claude bất kỳ đọc file này)

1. Khi user giao việc sửa 1 module/file bất kỳ nằm trong checklist §4b/§4a → tiện tay chuẩn hoá luôn theo `docs/design-system.md` §7, tick checkbox tương ứng trong file này.
2. Không tự ý mở 1 đợt riêng dọn hết toàn bộ §4b trừ khi user yêu cầu rõ ("dọn hết đi", "làm 1 lần cho xong") — khi đó chạy tuần tự theo batch ở mục 5a, không cần hỏi lại giữa chừng trừ khi gặp lỗi.
3. Mỗi lần đổi xong 1 file: `npx tsc --noEmit` (tối thiểu); nếu đổi từ 3 file trở lên trong 1 lần thì thêm `npm run build`.
4. Nếu move file đổi vị trí thư mục: chạy `pnpm graph:circular` trước và sau.
5. Cập nhật checklist trong RFC này (tick `[x]`) — đây là cách track tiến độ qua nhiều phiên, không phải hỏi lại từ đầu. Không dùng Linear/tool ngoài cho việc này — task cơ học, quy mô nhỏ.

### 5a. Batch cho §4b (dùng khi làm dứt điểm 1 lần, hoặc chọn đúng batch khi opportunistic)

Việc chủ yếu là đổi `w-[160px]`→`w-40`, `text-[10px]/[11px]`→`text-xs` theo bảng map — mỗi batch ước ~15-20 phút, không cần suy nghĩ nhiều vì pattern lặp lại.

- [ ] **Batch A** — users/attribute/author/branch/brand: `UsersColumns.tsx`, `AttributeDefinitionManagement.tsx`, `AuthorColumns.tsx`, `AuthorManagement.tsx`, `BranchColumns.tsx`, `BranchList.tsx`, `BranchManagement.tsx`, `BrandColumns.tsx`, `BrandManagement.tsx`
- [ ] **Batch B** — category/contact/dashboard/group: `CategoryManagement.tsx`, `category/columns.tsx`, `ContactManagement.tsx`, `DashboardOverview.tsx`, `group/columns.tsx`, `GroupManagement.tsx`
- [ ] **Batch C** — hp-page/inquiry/news/page: `HpPageColumns.tsx`, `HpPageManagement.tsx`, `InquiryManagement.tsx`, `LeadForm.tsx`, `NewsColumns.tsx`, `NewsManagement.tsx`, `PageManagement.tsx`
- [ ] **Batch D** — product-line/project-type/project: `ProductLineManagement.tsx`, `project-type/columns.tsx`, `ProjectTypeManagement.tsx`, `ProjectColumns.tsx`, `ProjectManagement.tsx`, `public/ProjectFilterMobile.tsx`
- [ ] **Batch E** — review/service: `ReviewColumns.tsx`, `ReviewFormSheet.tsx`, `ServiceGroupColumns.tsx`, `ServiceGroupManagement.tsx`, `ServiceColumns.tsx`, `ServiceManagement.tsx`
- [ ] **Batch F** — shipping-zone/system-page/tag + app public: `ShippingZoneManagement.tsx`, `SystemPageColumns.tsx`, `SystemPageManagement.tsx`, `TagColumns.tsx`, `app/(public)/layout.tsx`, `app/(public)/thong-tin/page.tsx`, `app/(public)/tin-tuc/[slug]/page.tsx`

Sau khi tick hết 1 batch: `npm run build` xác nhận, rồi mới sang batch kế (không bắt buộc gộp build cuối cùng cho cả 6 batch — lỗi phát hiện sớm theo batch dễ sửa hơn).

## 6. Không làm (non-goals)

- Không tạo folder atoms/molecules/organisms bên trong `modules/*` — module đã là domain boundary theo DDD, không áp thêm layer atomic lên trên.
- Không đổi `components.json` / vị trí `shared/components/ui/` — đây là nguồn sự thật cho shadcn CLI.
- Không làm 1 đợt "chuẩn hoá toàn bộ" ép buộc theo lịch — theo mục 5.
- Không sửa lỗi logic/bug không liên quan trong lúc chuẩn hoá style (vd lỗi lint có sẵn ở `wishlist-dialog.tsx` — setState trong effect — không thuộc phạm vi RFC này).

## 7. Log

- **2026-08-18** — Phase 0 xong (restructure `shared/components/`), viết `design-system.md` + RFC này, cài `madge`. Commit `cc38dd7` (restructure) + `e87e005` (docs).
- **2026-08-18** — Fix build error do ví dụ `bg-[var(--...)]` trong `design-system.md` bị Tailwind quét nhầm thành class thật (Turbopack dev parse CSS lỗi). Sửa ví dụ + thêm cảnh báo trong doc.
- **2026-08-18** — Chia §4b thành 6 batch cụ thể (§5a) để chạy dứt điểm khi cần, giữ track chỉ bằng checklist trong file này (không dùng Linear — task cơ học quy mô nhỏ).
