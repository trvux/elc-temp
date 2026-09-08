# Feature: thêm field `content` cho `project_type` (đoạn giới thiệu cho trang phân khúc `/du-an/<slug>`)

Status: Done — Phần A (elc-go) và Phần B (elc-temp) đã xong, verify qua API
thật (POST/PUT/GET) và qua UI thật (admin Tiptap Editor → `/du-an/cong-trinh-cong-nghiep`).

**⚠️ Việc này chạm cả 2 repo: `elc-go` (backend Go) và `elc-temp` (Next.js).**
Nếu Claude Code session hiện tại chỉ mở scope `elc-temp`, cần mở thêm 1 session
riêng cho `elc-go` để làm Phần A trước, hoặc mở 1 session ở thư mục cha
`/Users/vux/Documents/ELC` nếu công cụ cho phép thao tác cả 2 thư mục con.
Phần A phải xong (migration chạy + API trả về field mới) trước khi Phần B có
ý nghĩa test thật.

## Bối cảnh

`/du-an/cong-trinh-cong-nghiep` (và các trang phân khúc project khác) hiện
**không có chỗ viết đoạn giới thiệu dài** — bảng `project_type` chỉ có
`name`, `image`, `meta_title`, `meta_description`, không có cột nội dung.
Phát hiện trong lúc làm keyword mapping SEO: cần 1 đoạn intro tự nhiên nhắc
cả "máy lạnh công nghiệp" lẫn "điều hòa công nghiệp" (2 cách gọi đồng nghĩa,
đang lệch ranking rất lớn — pos 7.4 vs pos 65.5 cho cùng ý — vì content hiện
tại chỉ dùng 1 cách gọi ở nơi khác, còn trang phân khúc thì không có content
gì để dùng cả 2 cách gọi).

**Category** (`internal/category`, `modules/category`) đã có đúng field này
từ trước (`content JSONB`, hiển thị qua `ProductListModule.tsx` dòng ~158 &
~273: `const heroContent = entity.data.content;` rồi
`<ProductDescription content={heroContent} ... variant="hero" />`) — dùng
làm khuôn mẫu chính xác cho `project_type`, không tự nghĩ cách mới.

## Phần A — Backend (`elc-go`)

### A1. Migration mới

Thư mục `internal/project-type/migrations/`, đã có `000001`, `000002` — tạo
`000003_add_content.up.sql` / `.down.sql`, theo đúng kiểu cột của category
(`internal/category/migrations/000001_baseline_categories.up.sql` dòng có
`content JSONB`):

```sql
-- 000003_add_content.up.sql
ALTER TABLE project_type ADD COLUMN content JSONB;
```
```sql
-- 000003_add_content.down.sql
ALTER TABLE project_type DROP COLUMN content;
```

### A2. Domain (`internal/project-type/domain/types.go`)

Thêm field, getter, và — **theo đúng quy ước lazy-consolidation đã ghi
trong `elc-go/CLAUDE.md`** (đụng entity này để thêm field mới là đúng dịp
phải gộp luôn, không tách riêng) — gộp toàn bộ `UpdateName`, `UpdateSlug`,
`UpdateImage`, `UpdateMetaTitle`, `UpdateMetaDescription` (giữ riêng
`Reorder` và `SetFeatured`, giống branch RFC giữ riêng `Reorder`) thành 1
hàm `Update(input UpdateProjectTypeInput) error`. Tham khảo đúng pattern +
thứ tự fail-fast tại
`docs/rfc/2026-08-18-branch-domain-consolidate-update.md` và cách
`internal/branch/domain/types.go` đã làm — copy tinh thần, không bịa cách
khác.

Cụ thể:
- Thêm `content json.RawMessage` vào struct `ProjectType`
- Thêm tham số `content json.RawMessage` vào `NewProjectType` và
  `RehydrateProjectType`
- Thêm `func (p *ProjectType) Content() json.RawMessage { return p.content }`
- Thêm `Content json.RawMessage` vào `CreateProjectTypeInput` và
  `UpdateProjectTypeInput`
- Viết `func (p *ProjectType) Update(input UpdateProjectTypeInput) error`
  gộp `Name`, `Slug`, `Image`, `MetaTitle`, `MetaDescription`, `Content` —
  validate fail-fast đúng thứ tự các field đang validate hiện tại
  (name → slug → metaTitle → metaDescription), `Content` không cần validate
  (category cũng không validate content). Xoá `UpdateName`/`UpdateSlug`/
  `UpdateImage`/`UpdateMetaTitle`/`UpdateMetaDescription` sau khi gộp — check
  trước bằng `grep -rn "\.UpdateName\(\|\.UpdateSlug\(\|\.UpdateImage\(\|\.UpdateMetaTitle\(\|\.UpdateMetaDescription\(" internal/project-type/` xem có call site nào khác ngoài `application/update_project_type.go` không (branch RFC đã làm bước verify này, làm lại tương tự trước khi xoá).
- Giữ nguyên `SetFeatured`, `Reorder`, `MarkDeleted`, `Restore`.

### A3. Repository (`internal/project-type/infrastructure/postgres_repository.go`)

Theo đúng cách category làm (`internal/category/infrastructure/postgres_repository.go`
dòng 31, 34, 179, 196, 221, 297, 304, 311...): thêm `content` vào:
- Column list của SELECT
- INSERT statement + placeholder tương ứng
- UPDATE statement + placeholder tương ứng
- Scan destination (`&content`) ở cả 2 hàm đọc (GetByID-kiểu và GetAll-kiểu)
- Truyền `content` vào `RehydrateProjectType(...)` ở cuối mỗi hàm đọc

### A4. DTO (`internal/project-type/presentation/dto.go`)

Thêm `Content json.RawMessage \`json:"content"\`` vào response DTO và vào
DTO request tạo/sửa — theo đúng vị trí category làm (dto.go dòng 34, 99, 112).

### A5. Application (`internal/project-type/application/create_project_type.go`, `update_project_type.go`)

Wire `input.Content` qua use case, theo đúng cách
`internal/category/application/create_category.go` dòng 20 và
`update_category.go` dòng 56-57 làm (`if input.Content != nil { c.UpdateContent(input.Content) }`
— nhưng vì đã gộp `Update()` ở bước A2, `update_project_type.go` giờ gọi 1
lần `pt.Update(input)` thay vì set từng field, tương tự cách
`application.UpdateBranch` gọi `b.Update(input)`).

### A6. Handler (`internal/project-type/presentation/handler.go`)

Check xem Content có tự map qua (nếu handler dùng generic struct binding từ
DTO sang application input) hay cần thêm dòng map thủ công — theo đúng cách
category đang làm ở handler tương ứng.

### Verify Phần A

```bash
cd elc-go
go build ./... && go vet ./... && go test ./internal/project-type/...
```
Chạy migration lên DB dev, gọi thử API tạo/sửa 1 project type kèm `content`,
xác nhận GET trả về đúng field.

## Phần B — Frontend (`elc-temp`)

### B1. Domain types (`modules/project-type/domain/types.ts`)

Thêm `content?: Json` vào `ProjectType`, `ProjectTypeWithCategories`,
`CreateProjectTypeInput`, `UpdateProjectTypeInput` — theo đúng cách
`modules/category/domain/types.ts` đã có field này.

### B2. Admin form

File: `modules/project-type/presentation/hooks/useProjectTypeForm.ts` +
`modules/project-type/presentation/components/ProjectTypeManagement.tsx`.

Copy đúng cách `modules/category/presentation/hooks/useCategoryForm.ts` +
`CategoryManagement.tsx` đã làm (import `TiptapEditor` từ
`@/shared/components/ui/tiptap-editor`, field `content` trong form schema,
khối "Editor Section" trong JSX render — xem `CategoryManagement.tsx` dòng
~329-345 làm mẫu chính xác).

### B3. Public render (`modules/project/presentation/components/public/ProjectListModule.tsx`)

Tìm chỗ file này render `PageHero`/tiêu đề cho `projectType` (dùng
`grep -n "PageHero\|projectType\." modules/project/presentation/components/public/ProjectListModule.tsx`
để định vị chính xác — không đoán số dòng, file này 463 dòng, chưa đọc hết).
Thêm ngay sau phần header, theo đúng pattern
`ProductListModule.tsx` dòng ~158 & ~273:

```tsx
const heroContent = projectType.content;
// ...
{heroContent ? (
  <ProductDescription content={heroContent} fallbackAlt={projectType.name} variant="hero" />
) : null}
```

(Component tên `ProductDescription` dù nghe có vẻ chỉ dành cho sản phẩm —
đây là renderer richtext dùng chung, category cũng đang dùng lại y hệt tên
này cho content của nó, không phải bug đặt sai tên.)

## Không cần làm

- Không cần thêm content cho trang listing gốc `/du-an` (chỉ project_type
  theo từng phân khúc mới cần).
- Không cần đổi gì ở `Reorder`/`SetFeatured` — giữ nguyên như branch RFC đã
  quyết định.

## Verify sau khi fix (cả 2 phần xong)

1. Vào `/admin/project-types` → sửa "Công trình công nghiệp" → viết đoạn
   giới thiệu vào Tiptap Editor mới → Save.
2. `curl https://dienmayelc.com.vn/du-an/cong-trinh-cong-nghiep` (sau khi
   deploy) → xác nhận đoạn text mới xuất hiện trong HTML.
3. Cập nhật nội dung theo đúng khuyến nghị trong
   `seo-audit/data/keyword_mapping_thi_cong_du_an.md` — nhắc tự nhiên cả
   "máy lạnh công nghiệp" lẫn "điều hòa công nghiệp" trong đoạn giới thiệu
   này.
