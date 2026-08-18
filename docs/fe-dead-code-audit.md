# Audit dead code FE (knip — AST-based import/export graph)

- **Ngày:** 2026-08-18
- **Công cụ:** [`knip`](https://knip.dev) (`pnpm add -D knip`, đã có trong `devDependencies`). Chạy lại bất cứ lúc nào: `npx knip --reporter compact`.
- **Đây là báo cáo, chưa xoá gì** — để bạn tự quyết từng nhóm, tao chỉ phân loại + gắn mức rủi ro.

## Tóm tắt

| Nhóm | Số lượng | Rủi ro xoá |
|---|---|---|
| A — Rác/duplicate, xoá ngay không cần nghĩ | 2 file | Không có |
| B — Script vận hành thủ công, KHÔNG phải dead code | 1 file + `scratch/` (24 file) | N/A — đừng xoá |
| C — shadcn primitive cài sẵn, chưa dùng trong app | 26 file | Thấp (mất thì `shadcn add` lại) |
| D — Code app thật, không ai import | 30 file | **Cao nhất — cần bạn xác nhận từng file** |
| E — `package.json` dep thật sự không dùng ở đâu | 6 dep | Thấp, nhưng double-check trước khi gỡ |
| F — Export/type không dùng trong file đang sống | 65 export + 31 type | Thấp, dọn dần opportunistic |

## Nhóm A — Xoá an toàn, không cần cân nhắc

- `lib/utils.ts` — bản trùng y hệt `shared/lib/utils.ts` (diff chỉ 1 dòng trắng cuối file). Alias `utils` trong `components.json` đã trỏ `shared/lib/utils.ts` rồi — file gốc `lib/utils.ts` là rác thừa từ trước khi có `shared/`.
- `test-sort.ts` (root) — script test tay 1 lần cho `sortByOrderIndex`, không thuộc app, không có trong thư mục test nào.

## Nhóm B — KHÔNG phải dead code, là tool vận hành — giữ nguyên

- `index_urls.js` (root) — script gọi Google Indexing API (dùng dep `googleapis`), chạy tay khi cần đẩy URL vào Google index. Knip báo "unused" vì không nằm trong graph app, không có nghĩa là chết.
- `scratch/` (24 file: `.ts`/`.mjs`/`.json`/`.txt`) — scratchpad các đợt audit SEO/data trước đây (`check-noindex.ts`, `generate-migration-sitemap.ts`, `parse-gsc-csv.ts`...). Không phải source code app, là working files. Gợi ý: nếu không cần giữ lịch sử, thêm `scratch/` vào `.gitignore` thay vì coi là "dead code cần dọn" — khác bản chất với việc xoá code app chết.

## Nhóm C — shadcn primitive cài sẵn nhưng chưa dùng ở đâu (26 file)

`shared/components/ui/`: `alert.tsx`, `badge-custom.tsx`, `bubble.tsx`, `calendar.tsx`, `combobox.tsx`, `context-menu.tsx`, `direction.tsx`, `grid-container.tsx`, `hover-card.tsx`, `input-otp.tsx`, `kbd.tsx`, `marker.tsx`, `menubar.tsx`, `message-scroller.tsx`, `message.tsx`, `native-select.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `progress.tsx`, `resizable.tsx`, `slider.tsx`, `spinner.tsx`, `toggle-group.tsx`, `toggle.tsx`

Đây là output của `npx shadcn add` cài sẵn nhưng chưa có trang nào dùng tới. Rủi ro xoá thấp vì cần lại thì `shadcn add <name>` lấy lại đúng bản gốc trong vài giây. **Kéo theo nếu xoá**: 6 dep ở Nhóm E chỉ được dùng bởi đúng các file này (`react-day-picker`→`calendar.tsx`, `input-otp`→`input-otp.tsx`, `react-resizable-panels`→`resizable.tsx`, `@base-ui/react`→`combobox.tsx`, `@shadcn/react`→`message-scroller.tsx`).

## Nhóm D — Code app thật, không còn ai import (cần bạn xác nhận từng file)

Rủi ro cao nhất — có thể là code đã bị thay thế (an toàn xoá) hoặc code cho tính năng dở dang/sắp làm (đừng xoá). Tao **không tự xoá** nhóm này.

**Module (component/index thừa từ module cũ, nghi đã bị thay bằng bản khác):**
- `modules/branch/domain/mocks.ts`
- `modules/catalog/presentation/components/ProductList.tsx`
- `modules/contact/index.ts`, `modules/dashboard/application/index.ts`, `modules/dashboard/domain/index.ts`, `modules/news/index.ts`, `modules/page/index.ts` — barrel file rỗng vai trò, không ai import qua đường này
- `modules/news/presentation/components/NewsCard.tsx`, `NewsList.tsx`
- `modules/project/presentation/components/ProjectList.tsx`, `public/ProjectSearchInput.tsx`
- `modules/service-group/domain/repository.ts`, `modules/service/domain/repository.ts` — interface repository không còn ai reference (có thể domain layer đổi cách khác)

**shared/components/organisms (nghi bị thay bằng bản khác cùng chức năng, hoặc tính năng đã gỡ):**
- `layout/admin/rich-text-editor/editor-toolbar.tsx` — **chính là file untracked "lạ" mà 2 phiên trước tao cứ né không đụng tới** (bị cuốn theo khi `git mv` restructure Phase 0). Giờ có bằng chứng rõ: không ai import file này cả — khả năng cao là bản nháp/thử nghiệm bị bỏ quên trước khi commit.
- `layout/user/info-toc.tsx`, `motion-provider.tsx`, `pagination-nav.tsx`, `product-search-input.tsx`, `product-search.tsx`, `public-filter-sidebar.tsx`
- `sections/hero-contact-actions.tsx`, `hero-media.tsx`, `hero-slideshow.tsx`, `showcase.tsx`

**shared/hooks, shared/lib, shared/types:**
- `hooks/use-debounce.ts`, `use-featured-image-upload.ts`, `use-local-storage.ts`
- `lib/cached-system-page.ts`, `errors.ts`, `events.ts`, `glass-utils.ts`, `hover-effects.ts`, `pagination.ts`
- `types/api.ts`, `common.ts`, `database.ts`, `supabase.ts`

## Nhóm E — `package.json` dep thật sự không dùng ở bất cứ đâu (đã verify, không cascade từ nhóm C)

`sharp`, `date-fns`, `fuse.js`, `jsonwebtoken`, `@radix-ui/react-slot`, `@tiptap/extension-typography` — 0 file nào trong source code (kể cả `ui/`, `scratch/`) tham chiếu tới. An toàn gỡ khỏi `package.json`, nhưng double-check thêm: `sharp` đôi khi được Next.js tự động dùng ngầm cho `next/image` optimization ở production/self-host — **không xoá `sharp` mà chưa xác nhận** deploy có tự cài nó hay không (xem `elc-go DB infra` / VPS deploy pipeline trong memory, self-host thường cần `sharp` cài cứng).

**Devdeps không dùng:** `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event`, `msw` — 4 gói testing cài sẵn nhưng chưa có test nào dùng (không có thư mục `__tests__` dùng React Testing Library, các test hiện có là domain-logic thuần theo `modules/*/__tests__/domain/`).

## Nhóm F — Unused exports/exported types (phụ lục, dọn dần)

65 export + 31 type không dùng nằm rải trong các file **đang sống bình thường** (không phải cả file chết, chỉ 1 phần export thừa — thường là validator/schema/action cũ không còn gọi, hoặc type public chưa ai cần). Chạy `npx knip --reporter compact` để xem danh sách đầy đủ, dọn theo kiểu opportunistic khi đụng đúng file đó (giống cách làm Phase 1 UI/UX) — không đáng làm riêng 1 đợt.

Đáng chú ý: `modules/project/presentation/components/ProjectCard.tsx` export trùng cả named `ProjectCard` lẫn `default` — 1 trong 2 là thừa, nên gộp về 1 kiểu export.

## Đề xuất thứ tự làm (nếu muốn dọn)

1. Nhóm A (2 file) — làm ngay, an toàn tuyệt đối.
2. Nhóm E, trừ `sharp` — gỡ khỏi `package.json`, chạy lại `pnpm install` + `npm run build` verify.
3. Nhóm C — xoá hoặc giữ tuỳ bạn có định dùng combobox/calendar/OTP input... trong tương lai gần không.
4. Nhóm D — review từng file, tao **không tự xoá** vì cần domain knowledge (có phải đã bị thay thế bằng module/component khác chưa).
5. Nhóm B — quyết định gitignore `scratch/` hay giữ nguyên track.
