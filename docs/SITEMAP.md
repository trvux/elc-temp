# Sơ đồ route công khai — ELC (Điện máy ELC)

> Bản đồ toàn bộ route trong `app/(public)`, đọc trực tiếp từ code (`page.tsx`, `sitemap.ts`), không suy đoán.
> Mục đích: cho AI/dev tra cứu nhanh route nào render gì, lấy dữ liệu từ module nào, và các hành vi
> đặc biệt (route đa hình, redirect legacy, biến thể noindex) để tránh sửa nhầm hoặc tạo route trùng.
>
> Cập nhật: 2026-07-14 · Đối chiếu với [ARCHITECTURE.md](./ARCHITECTURE.md) §6 (mục đó đã cũ, còn ghi
> `/chi-nhanh` — route thật hiện tại là `/thong-tin/[slug]`, xem §4 bên dưới).
> Tính năng "district" (quận/huyện) — route combo `[location]`, district-hub ở `/dich-vu/[slug]`,
> `shared/lib/districts.ts` — đã bị gỡ bỏ hoàn toàn, không còn dùng nữa.

---

## 1. Cây route tổng quan

```
/                                  Trang chủ (sections: hero, brand, category carousels, project marquee, cta)
│
├── /san-pham                      Danh sách sản phẩm (filter category/brand/search)
│   ├── /san-pham/[slug]           ĐA HÌNH: category | brand | group | product
│   │
├── /du-an                         Danh sách dự án
│   └── /du-an/[slug]              ĐA HÌNH: project_type | project
│
├── /dich-vu                       Danh sách dịch vụ (nhóm theo service_group)
│   ├── /dich-vu/[slug]            service
│   │
├── /tin-tuc                       Danh sách tin tức (không có tầng chuyên mục)
│   └── /tin-tuc/[slug]            Chi tiết bài viết
│
├── /thong-tin                     Hub "Thông tin" — gộp 2 nguồn dữ liệu khác nhau
│   │                                 · khối "Thông tin về ELC" → link ra /[slug] (pages)
│   │                                 · khối "Cơ sở hạ tầng"    → link ra /thong-tin/[slug] (branches)
│   └── /thong-tin/[slug]          Chi tiết chi nhánh (branch): bản đồ, giờ mở cửa
│
├── /co-so-ha-tang                 LEGACY — redirect thuần, không render gì
│   ├── /co-so-ha-tang             → redirect → /thong-tin#branches-section
│   └── /co-so-ha-tang/[slug]      → redirect → /thong-tin/[slug]
│
├── /[slug]                        Trang tĩnh CMS (catch-all cuối) — vd /gioi-thieu, /chinh-sach-bao-hanh
├── /gone                          410 Gone — URL cũ từ web WordPress đã xoá
```

---

## 2. Bảng route → module → dữ liệu

| Route | File | Module gọi | Ghi chú |
|---|---|---|---|
| `/` | `app/(public)/page.tsx` | brand, catalog, category, contact, project, settings, branch | `"use cache"` theo tag `products-list, projects-list, brands, layout, categories` |
| `/san-pham` | `.../san-pham/page.tsx` | catalog.searchProducts, category.getCategories | filter qua querystring `?search=`, `?brands=` |
| `/san-pham/[slug]` | `.../san-pham/[slug]/page.tsx` | catalog.resolveProductPath | xem §3 — route đa hình |
| `/du-an` | `.../du-an/page.tsx` | project.ProjectListModule (projectType=null) | |
| `/du-an/[slug]` | `.../du-an/[slug]/page.tsx` | project.resolveProjectPath, service, branch | xem §3 — route đa hình |
| `/dich-vu` | `.../dich-vu/page.tsx` | service.getPublishedServicesGrouped | gộp theo `service_group` |
| `/dich-vu/[slug]` | `.../dich-vu/[slug]/page.tsx` | service.getServiceBySlug | |
| `/tin-tuc` | `.../tin-tuc/page.tsx` | news.getNews | không phân trang theo chuyên mục |
| `/tin-tuc/[slug]` | `.../tin-tuc/[slug]/page.tsx` | news.getNewsBySlug | |
| `/thong-tin` | `.../thong-tin/page.tsx` | page.getPages, branch.getBranches | 2 khối nội dung, xem §4 |
| `/thong-tin/[slug]` | `.../thong-tin/[slug]/page.tsx` | branch.getBranchBySlug | **không phải** `page` module dù cùng tên "thong-tin" |
| `/co-so-ha-tang` | `.../co-so-ha-tang/page.tsx` | — | `redirect("/thong-tin#branches-section")`, 5 dòng, không fetch gì |
| `/co-so-ha-tang/[slug]` | `.../co-so-ha-tang/[slug]/page.tsx` | — | `redirect(\`/thong-tin/${slug}\`)`, 12 dòng, không fetch gì |
| `/[slug]` | `app/(public)/[slug]/page.tsx` | page.getPageBySlug | catch-all — chỉ khớp khi không route nào ở trên khớp trước |
| `/gone` | `.../gone/page.tsx` | — | 410 cho URL cũ, dùng cùng `redirect-map.json` ở proxy.ts |

---

## 3. Route đa hình (polymorphic `[slug]`)

Hai route dùng chung 1 slug động cho nhiều loại thực thể khác nhau, phân giải bằng 1 hàm `resolve*Path`
tra nhiều bảng theo thứ tự ưu tiên rồi trả về `{ type, data }`:

| Route | Hàm resolve | `type` có thể | Render |
|---|---|---|---|
| `/san-pham/[slug]` | `resolveProductPath` (`modules/catalog/application`) | `product` \| `category` \| `group` \| `brand` | `product` → `ProductDetailModule`; còn lại → `ProductListModule` |
| `/du-an/[slug]` | `resolveProjectPath` (`modules/project/application`) | `project` \| `project_type` | `project` → bài chi tiết; `project_type` → `ProjectListModule` lọc theo service/category/condition (querystring) |

**Vì sao quan trọng với AI:** thêm slug mới cho category/brand/product (hoặc project/project_type) phải
đảm bảo không đụng slug nhau trong cùng 1 route — vì cùng nằm chung 1 namespace phẳng. Không tạo thêm
sub-route tĩnh trùng tên bên dưới các hub này (vd không thêm `/san-pham/new` cứng) vì sẽ bị `[slug]`
catch trước hoặc xung đột.

---

## 4. `/thong-tin` — 2 nguồn dữ liệu trong 1 trang

Trang `/thong-tin` không phải danh sách 1 loại nội dung mà ghép 2 khối:

1. **"Thông tin về ELC"** — danh sách từ bảng `pages` (module `page`). Mỗi item link ra
   **`/[slug]`** (route gốc, không có tiền tố `/thong-tin/`).
2. **"Cơ sở hạ tầng"** (`id="branches-section"`) — danh sách từ bảng `branches` (module `branch`).
   Mỗi item link ra **`/thong-tin/[slug]`**.

Route `/co-so-ha-tang` (số ít, không dấu gạch nối với "thong-tin") là URL cũ trước khi 2 khối này được
gộp vào `/thong-tin` — nay chỉ còn tác dụng redirect, giữ lại để không vỡ backlink/URL đã index.

---

## 5. Khu quản trị (không thuộc sitemap public)

`/admin/login`, `/admin/*` — dashboard CRUD cho toàn bộ dữ liệu nuôi các route ở trên (products,
categories, brands, group-categories, projects, project-types, services, service-groups, news, pages,
system-pages, branches, contacts, settings). Chi tiết cấu trúc từng module xem
[ARCHITECTURE.md](./ARCHITECTURE.md) §3 và §4.

---

## 6. Nguồn đối chiếu

- Route thật: `find app -name page.tsx` trong `app/(public)`.
- Dữ liệu nạp sitemap.xml: `app/sitemap.ts` (bảng Supabase nào sinh ra route nào, và route nào bị loại có chủ đích).
- Menu hiển thị: động từ `modules/settings` (`NavLink[]`), không hardcode trong component — không suy ra
  cấu trúc menu từ file tĩnh nào.
