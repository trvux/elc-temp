# RFC: Dọn dead code FE

- **Status:** Hoàn thành — nhóm A, D, E đã xóa/gỡ dep trên `main`; nhóm B (`scratch/`, `index_urls.js`) giữ nguyên như quyết định; nhóm C, F chưa đụng, để opportunistic.
- **Đọc trước:** [`docs/fe-dead-code-audit.md`](./fe-dead-code-audit.md) — báo cáo audit gốc bằng `knip`, 6 nhóm A-F.
- File này chỉ quyết định + lý do cho từng nhóm, không lặp lại số liệu ở audit gốc.

## Quyết định phạm vi đợt này

| Nhóm | Quyết định | Lý do |
|---|---|---|
| A (2 file rác/duplicate) | **Xoá** | Không tranh cãi. |
| B (`scratch/`, `index_urls.js`) | **Bỏ qua** | Không phải dead code — script vận hành/test local, không thuộc phạm vi "làm sạch mã nguồn app". |
| C (26 shadcn primitive chưa dùng) | **Giữ nguyên** | Không đụng `ui/`, để dành dùng tương lai gần. |
| D (37 file app thật không ai import) | **Xoá, đã điều tra từng nhóm nhỏ** — xem mục dưới. |
| E (dep `package.json` thừa) | **Xoá 6 dep + 4 devDep**, trừ `sharp` (giữ lại phòng self-host cần) | Đã verify 0 tham chiếu thật trong source. |
| F (65 export + 31 type thừa trong file đang sống) | **Bỏ qua đợt này** | Rủi ro thấp nhưng dàn trải nhiều file, để opportunistic như đã thống nhất trước. |

## Điều tra Nhóm D — vì sao không ai import nữa

Tra bằng `git log`, tìm component/interface "thay thế" (grep chéo), đọc nội dung. Không tìm thấy TODO/tính năng dở dang ở file nào — tất cả đều có bằng chứng "đã bị thay thế" hoặc "chưa từng được gắn vào đâu".

**Barrel `index.ts` re-export không ai dùng (5 file)** — mọi module khác cũng có `index.ts` tương tự nhưng **có** người import qua đó; riêng 5 module này mọi consumer đều import thẳng deep-path, bỏ qua barrel:
`modules/contact/index.ts`, `modules/dashboard/application/index.ts`, `modules/dashboard/domain/index.ts`, `modules/news/index.ts`, `modules/page/index.ts`

**Component bị thay bằng bản khác cùng chức năng (7 file)** — verify bằng cách tìm bản "thay thế" đang được import thật:
- `modules/catalog/presentation/components/ProductList.tsx` → thay bằng `ProductGrid.tsx` (đang dùng ở `san-pham/layout.tsx`, `ProductDetailModule.tsx`, `ProductListModule.tsx`)
- `modules/project/presentation/components/ProjectList.tsx` → thay bằng `ProjectListModule.tsx` (đang dùng ở `/du-an`, `/du-an/[slug]`)
- `modules/news/presentation/components/NewsCard.tsx`, `NewsList.tsx` → trang `/tin-tuc` render card trực tiếp trong `page.tsx` bằng `GridSection` + JSX inline, không gọi 2 component này
- `shared/components/organisms/layout/user/product-search.tsx`, `product-search-input.tsx` → thay bằng `ProductSearchBox.tsx` (đang dùng trong `ProductListModule.tsx`)
- `modules/project/presentation/components/public/ProjectSearchInput.tsx` → 0 nơi import, không tìm thấy bản thay thế cụ thể nhưng trang `/du-an` không có ô tìm kiếm project nào cả (tính năng có thể đã bị bỏ luôn, không phải bị thay)

**Domain interface không ai implement — module gọi Go API trực tiếp, không qua Repository pattern (2 file):**
`modules/service/domain/repository.ts`, `modules/service-group/domain/repository.ts` — grep chỉ match chính file, không có `infrastructure/` nào implement interface này.

**Hero section cũ, bị thay bởi `hero.tsx` hiện tại (4 file)** — `hero.tsx` (đang dùng ở trang chủ) chỉ import `hero-brand-marquee.tsx` + `hero-rotating-word.tsx`, không đụng tới:
`hero-media.tsx`, `hero-slideshow.tsx`, `hero-contact-actions.tsx`, `sections/showcase.tsx`

**Mock data cũ, module đã chuyển sang API thật (1 file):**
`modules/branch/domain/mocks.ts` — data chi nhánh hardcode, `BranchManagement.tsx`/`BranchList.tsx` hiện fetch API thật.

**Utility/hook/type cô lập, chưa từng được gắn vào đâu — 0 tham chiếu tuyệt đối (15 file):**
`shared/hooks/use-debounce.ts`, `use-featured-image-upload.ts`, `use-local-storage.ts`, `shared/lib/cached-system-page.ts`, `glass-utils.ts`, `hover-effects.ts`, `errors.ts`, `events.ts`, `pagination.ts`, `shared/types/api.ts`, `common.ts`, `shared/components/organisms/layout/user/motion-provider.tsx`, `pagination-nav.tsx`, `info-toc.tsx`, `public-filter-sidebar.tsx`

**Leftover Supabase-era type, đã migrate sang Go API (2 file):**
`shared/types/database.ts`, `shared/types/supabase.ts` — chỉ 2 file này tự import `database.types.ts` (giữ nguyên, còn 1 nơi khác dùng thật: `modules/service/domain/types.ts`), xoá 2 wrapper này không ảnh hưởng `database.types.ts`.

**File "lạ" nghi bản nháp bỏ quên (1 file):**
`shared/components/organisms/layout/admin/rich-text-editor/editor-toolbar.tsx` — untracked từ trước phiên làm việc này, không ai import, không tìm thấy lý do tồn tại.

## Kế hoạch thực hiện

1. Nhánh riêng: `chore/fe-dead-code-cleanup` (không commit thẳng `main`).
2. Xoá theo nhóm: A → D → E, mỗi nhóm 1 commit để dễ review/revert riêng lẻ.
3. Sau mỗi nhóm: `npx tsc --noEmit` + `npm run build`; sau khi xong hết: chạy lại `npx knip --reporter compact` xác nhận không còn phát sinh unused mới (import chết do xoá file gây ra).
4. Push nhánh, không tự merge.
5. Chạy skill `code-review` (Standards + Spec) trên nhánh trước khi merge.
6. Merge `main` chỉ sau khi review pass + build xanh.
