# Kiến trúc hệ thống — ELC (Điện máy ELC)

> Tài liệu tổng quan toàn bộ project để **audit & control**. Vẽ rõ từng module có hàm gì,
> làm được gì, các module nối với nhau ra sao, và phân tách rạch ròi **Admin Panel** vs **Public**.
>
> Cập nhật: 2026-06-07 · Stack: Next.js 16 (App Router) · React 19 · Supabase · TanStack Query/Table · TipTap · Tailwind

---

## 1. Tổng quan toàn hệ thống

```
                                  ┌────────────────────────────────────────────┐
                                  │                NGƯỜI DÙNG                    │
                                  │   Khách (Public)        │   Admin (CMS)      │
                                  └───────────┬─────────────┴─────────┬─────────┘
                                              │                       │
                          ┌───────────────────▼───────────────────────▼─────────────────┐
                          │                   proxy.ts  (Next middleware)                │
                          │  • updateSession() — refresh Supabase auth cookie            │
                          │  • Chặn pattern WordPress rác (wp-admin, .php, /category/…)  │
                          │  • redirect-map.json — 301 redirect SEO từ web cũ            │
                          └───────────────────┬───────────────────────┬─────────────────┘
                                              │                       │
                       ┌──────────────────────▼─────────┐   ┌─────────▼──────────────────────┐
                       │       app/(public)             │   │       app/(admin)              │
                       │  Server Components (SEO, SSG)   │   │  getCurrentUser() guard        │
                       │  Trang khách: /, /du-an, …      │   │  /admin/* dashboard            │
                       └──────────────────────┬─────────┘   └─────────┬──────────────────────┘
                                              │                       │
                          ┌───────────────────▼───────────────────────▼─────────────────┐
                          │                      modules/*  (DDD)                        │
                          │   presentation → application → domain ← infrastructure       │
                          └───────────────────────────────┬──────────────────────────────┘
                                                          │
                          ┌───────────────────────────────▼──────────────────────────────┐
                          │         shared/lib/supabase  (client | server | static)      │
                          └───────────────────────────────┬──────────────────────────────┘
                                                          │
                          ┌───────────────────────────────▼──────────────────────────────┐
                          │                    SUPABASE (Postgres + Auth + Storage)       │
                          └──────────────────────────────────────────────────────────────┘
```

**Thư mục gốc:**

| Thư mục | Vai trò |
|---|---|
| `app/` | Routing (Next App Router). `(public)` = web khách, `(admin)` = CMS, `api/` = REST endpoint |
| `modules/` | Logic nghiệp vụ, mỗi domain 1 module theo kiến trúc DDD 4 lớp |
| `shared/` | Code dùng chung: UI components, layout, hooks, lib (supabase, seo, image…), providers |
| `components/`, `lib/` | ⚠️ Legacy gần như rỗng — xem [§7 Audit](#7-audit--cảnh-báo) |
| `supabase/`, `database.types.ts` | Schema & type sinh tự động từ DB |
| `proxy.ts` / `shared/proxy.ts` | Middleware: auth session + chặn bot + redirect SEO |
| `redirect-map.json` | Bảng 301 redirect từ URL WordPress cũ |

---

## 2. Kiến trúc 1 module (DDD 4 lớp)

Mọi module trong `modules/` đều theo cùng 1 khuôn. Lấy `project` làm ví dụ chuẩn:

```
modules/project/
├── index.ts                    ← barrel: re-export ra ngoài
│
├── domain/                     ← TẦNG LÕI (không phụ thuộc framework)
│   ├── types.ts                  Project, ProjectWithCategory, CreateInput, UpdateInput
│   ├── constants.ts              hằng số (vd: số item/trang)
│   ├── validators.ts             kiểm tra dữ liệu đầu vào
│   ├── repository.ts             INTERFACE ProjectRepository (hợp đồng)
│   └── index.ts
│
├── application/                ← USE-CASES (1 file = 1 hành động)
│   ├── getProjects.ts            getProjects(), countProjects()
│   ├── getProjectBySlug.ts       getProjectBySlug()
│   ├── getProjectById.ts         getProjectById(), getProjectsByIds()
│   ├── getRelatedProjects.ts     getRelatedProjects(), getFeaturedProjects()
│   ├── createProject.ts          createProject()
│   ├── updateProject.ts          updateProject(), toggle…, updateOrder()
│   ├── deleteProject.ts          deleteProject()
│   ├── resolveProjectPath.ts     resolveProjectPath() (cho [slug] router)
│   └── index.ts
│
├── infrastructure/             ← TRIỂN KHAI repository bằng Supabase
│   ├── projectRepo.ts            class hiện thực ProjectRepository → gọi supabase.from("projects")
│   └── index.ts
│
└── presentation/               ← GIAO DIỆN + cổng gọi từ client
    ├── actions.ts                "use server" — server actions (bọc application + revalidate cache)
    ├── components/
    │   ├── ProjectManagement.tsx   [ADMIN] CRUD UI (bảng + form)
    │   ├── ProjectColumns.tsx      [ADMIN] cột cho data-table
    │   ├── ProjectList.tsx         [ADMIN] list
    │   ├── ProjectCard.tsx         dùng chung
    │   └── public/                 [PUBLIC] UI cho web khách
    │       ├── ProjectListModule.tsx
    │       ├── ProjectFilters.tsx / ProjectFilterMobile.tsx
    │       └── ProjectSearchInput.tsx
    └── hooks/
        └── useProjectForm.ts       state form (react-hook-form)
```

**Luật phụ thuộc (dependency rule):**

```
presentation ──► application ──► domain ◄── infrastructure
  (UI/action)     (use-case)     (type/    (Supabase repo
                                  interface)  hiện thực interface)
```

- `domain` không import gì từ tầng ngoài → thuần TypeScript.
- `application` chỉ gọi `domain` (interface) + repo instance từ `infrastructure`.
- `presentation/actions.ts` là **ranh giới client↔server**: client gọi action → action gọi use-case → use-case gọi repo → Supabase.

**Dòng dữ liệu 1 request (vd tạo dự án ở Admin):**

```
[Admin form] ProjectManagement.tsx
     │ submit
     ▼
createProjectAction(input)          presentation/actions.ts  "use server"
     │
     ▼
createProject(input)                application/createProject.ts
     │  validate (domain/validators)
     ▼
projectRepo.create(input)           infrastructure/projectRepo.ts
     │
     ▼
supabase.from("projects").insert()  shared/lib/supabase/server.ts
     │
     ▼
revalidatePath("/du-an") + revalidateTag("projects")   ← public web tự cập nhật
```

---

## 3. Danh mục module & chữ ký hàm (full signature)

> Ký hiệu lớp: **[D]** domain · **[A]** application/use-case · **[Act]** server action · **[Repo]** infrastructure

### 3.1 `auth` — Xác thực admin
Bảng: Supabase Auth. Bảo vệ toàn bộ `/admin`.

```ts
[A]  login(input: LoginInput): Promise<AuthResponse>
[A]  getCurrentUser(): Promise<AuthUser | null>
[A]  logout(): Promise<{ error?: string }>
[Act] loginAction, logoutAction
```
Import đặc biệt: `@/modules/auth/server` (dùng trong `app/(admin)/.../layout.tsx` để chặn truy cập).

### 3.2 `project` — Dự án / công trình  → bảng `projects`
```ts
[D Repo interface ProjectRepository]
   getAll(options?: ProjectFilter): Promise<ProjectWithCategory[]>
   count(options?): Promise<number>
   getById(id): Promise<ProjectWithCategory | null>
   getBySlug(slug): Promise<ProjectWithCategory | null>
   create(input: CreateProjectInput): Promise<Project>
   update(input: UpdateProjectInput): Promise<Project>
   delete(id): Promise<void>
   getByIds(ids: string[]): Promise<ProjectWithCategory[]>
   updateOrder(id, orderIndex): Promise<void>
   togglePublish(id, isPublished): Promise<void>
   toggleFeatured(id, isFeatured): Promise<void>
   getFeatured(limit?): Promise<ProjectWithCategory[]>
   getRelated(projectId, categoryId, limit?): Promise<ProjectWithCategory[]>

[A]  getProjects(options?: ProjectFilter)            getProjectBySlug(slug)
     countProjects(options?)                          getProjectById(id)
     getProjectsByIds(ids: string[])                  getRelatedProjects(projectId, categoryId, limit?)
     getFeaturedProjects(limit?)                      resolveProjectPath(slug): Promise<ResolvedProjectEntity>
     createProject(input)   updateProject(input)   deleteProject(id)
     toggleProjectPublish(id, isPublished)   toggleProjectFeatured(id, isFeatured)   updateProjectOrder(id, orderIndex)

[Act] getProjectsAction, countProjectsAction, createProjectAction, updateProjectAction,
      deleteProjectAction, toggleProjectPublishAction, toggleProjectFeaturedAction, updateProjectOrderAction
```
FK: `categoryId` → `project_category`, `projectTypeId` → `project_type`.

### 3.3 `catalog` — Sản phẩm  → bảng `products`
```ts
[A]  getProducts(options?: ProductFilter): Promise<ProductWithRelations[]>
     getFeaturedProducts(limit = 4): Promise<ProductWithRelations[]>
     getProductBySlug(slug): Promise<ProductWithRelations | null>
     searchProducts(...)                  ← tìm kiếm (fuse.js)
     resolveProductPath(slug): Promise<ResolvedEntity>
     createProduct(input)  updateProduct(input)  deleteProduct(id)
[Repo] getAll, count, getById, getBySlug, getByIds, create, update, delete
[Act] getProductsAction, createProductAction, updateProductAction, deleteProductAction,
      getBrandsAction, createBrandAction   ← (tiện ích, gọi sang brand)
```
FK: `categoryId` → `categories` (module **category** cũ), `brandId` → `brands`.
Public components: `ProductDetailModule`, `ProductListModule`, `ProductCard`, `ProductFilters`.

### 3.4 `brand` — Thương hiệu  → bảng `brands`
```ts
[A]  getBrands(options?: BrandFilter): Promise<Brand[]>
     getBrandBySlug(slug): Promise<Brand | null>     getBrandById(id): Promise<Brand | null>
     createBrand(input): Promise<Brand>   updateBrand(input): Promise<Brand>   deleteBrand(id): Promise<void>
[Repo] getAll, count, getById, getBySlug, getByIds, create, update, delete
[Act] getBrandsAction, getBrandByIdAction, createBrandAction, updateBrandAction, deleteBrandAction
```

### 3.5 `category` — Danh mục SẢN PHẨM (cũ)  → bảng `categories`
```ts
[A]  getCategories(options?: CategoryFilter): Promise<Category[]>
     getCategoryTree(type?: CategoryType): Promise<CategoryWithChildren[]>   ← cây cha-con
     getCategoryBySlug(slug)   getCategoryById(id)   getCategoryIdsBySlug(slug): Promise<string[]>
     getCategoryDisplayName(category): string
     createCategory(input)  updateCategory(input)  deleteCategory(id)
[Repo] getChildren(parentId), getBySlug(slug, type?), count, create, update, delete
[Act] getCategoriesAction, createCategoryAction, updateCategoryAction, deleteCategoryAction
```
Self-relation: `parentId`. **Chỉ còn dùng cho sản phẩm** (catalog + trang `/san-pham`). ⚠️ xem Audit.

### 3.6 `category-new` — Danh mục DỰ ÁN (mới)  → bảng `project_category`
```ts
[A]  getCategoriesNew(options?: CategoryNewFilter): Promise<CategoryNewWithGroup[]>
     getCategoryNewById(id): Promise<CategoryNewWithGroup | null>
     createCategoryNew(input)  updateCategoryNew(input)  deleteCategoryNew(id)
[Repo] count, create, delete, getAll, getById, update
[Act] getCategoriesNewAction, createCategoryNewAction, updateCategoryNewAction, deleteCategoryNewAction
```
FK: `groupId` → `group_categories`. Đây là module gắn vào menu Admin **"Danh mục"**.

### 3.7 `group` — Nhóm danh mục  → bảng `group_categories`
```ts
[A]  getGroups(options?: GroupFilter): Promise<Group[]>   getGroupById(id): Promise<Group | null>
     createGroup(input)  updateGroup(input)  deleteGroup(id)
[Repo] count, create, delete, getAll, getById, update
[Act] getGroupsAction, createGroupAction, updateGroupAction, deleteGroupAction
```
Cha của `category-new`. Menu Admin **"Nhóm danh mục"**.

### 3.8 `project-type` — Loại hình công trình  → bảng `project_type` (+ `project_type_category`)
```ts
[A]  getProjectTypes(options?): Promise<ProjectTypeWithCategories[]>
     getProjectTypeById(id): Promise<ProjectTypeWithCategories | null>
     createProjectType(input)  updateProjectType(input)  deleteProjectType(id)
[Repo] count, create, delete, getAll, getById, update
[Act] getProjectTypesAction, createProjectTypeAction, updateProjectTypeAction, deleteProjectTypeAction
```
Quan hệ M:N với `category-new` qua bảng nối `project_type_category` (field `categoryIds`).

### 3.9 `service` — Dịch vụ  → bảng `services`
```ts
[A]  getServices(options?: ServiceFilter)
     getPublishedServicesGrouped(): Promise<GroupedServices[]>   ← gộp dịch vụ theo nhóm cho trang /dich-vu
     getServiceById(id)   getServiceBySlug(slug)
     createService(input)  updateService(input)
     deleteService(id)  → softDelete   restoreService(id)  ← soft-delete + khôi phục
[Repo] getAll, getById, getBySlug, create, update, softDelete, restore
[Act] getServicesAction, createServiceAction, updateServiceAction, deleteServiceAction
```
FK: `groupId` → `service_groups`, `categoryId`. `getPublishedServicesGrouped()` **gọi sang `service-group`**.

### 3.10 `service-group` — Nhóm dịch vụ  → bảng `service_groups`
```ts
[A]  getServiceGroups(options?)   getServiceGroupById(id)   getServiceGroupBySlug(slug)
     createServiceGroup(input)  updateServiceGroup(input)
     deleteServiceGroup(id)   restoreServiceGroup(id)   ← soft-delete
[Act] getServiceGroupsAction, createServiceGroupAction, updateServiceGroupAction, deleteServiceGroupAction
```
Cha của `service`. Field `categoryIds` (liên kết tới category).

### 3.11 `news` — Tin tức  → bảng `news`
```ts
[A]  getNews(options?: NewsFilter)   getNewsBySlug(slug)
     createNews(input)  updateNews(input)  deleteNews(id)
[Repo] getAll, count, getBySlug, create, update, delete
[Act] getNewsAction, createNewsAction, updateNewsAction, deleteNewsAction
```

### 3.12 `page` — Trang tĩnh  → bảng `pages` (+ `about_blocks`)
```ts
[A]  getPages(options?: PageFilter)   getPageBySlug(slug)
     getAboutBlocks()                 ← khối nội dung trang "Thông tin"
     createPage(input)  updatePage(input)  deletePage(id)
[Repo] getAll, count, getBySlug, create, update, delete, updateAll(blocks)
[Act] getPagesAction, createPageAction, updatePageAction, deletePageAction
```

### 3.13 `branch` — Chi nhánh  → bảng `branches`
```ts
[A]  getBranches(options?: BranchFilter)   getBranchBySlug(slug)
     countBranches(options?)
     createBranch(input)  updateBranch(input)  deleteBranch(id)  updateBranchOrder(id, orderIndex)
[Repo] getAll, getBySlug, count, create, update, delete, updateOrder
[Act] getBranchesAction, getBranchesWithCountAction, createBranchAction, updateBranchAction,
      deleteBranchAction, updateBranchOrderAction
```
Public: `BranchList` (trang `/chi-nhanh`, `/thong-tin`).

### 3.14 `contact` — Liên hệ / form khách  → bảng `contacts`
```ts
[A]  getContacts(options?: ContactFilter)
     createContact(input)  updateContact(input)  deleteContact(id)
[Act] getContactsAction, createContactAction, updateContactAction, deleteContactAction
```
⚠️ Trùng chức năng với `settings` (cả 2 đều có create/get/update/deleteContact) — xem Audit.

### 3.15 `settings` — Cài đặt site + thông tin liên hệ  → bảng `site_settings` (+ `contacts`)
```ts
[A]  getSiteSettings(): Promise<...>           updateSettings(settings: SiteSetting[])
     getPublicLayoutData()                     ← gom data cho layout public (header/footer)
     getContacts()   createContact(input)   updateContact(input)   deleteContact(id)
[Act] updateSettingsAction, createContactAction, updateContactAction, deleteContactAction
```
`getPublicLayoutData()` là điểm vào cho `app/(public)/layout.tsx`.

### 3.16 `dashboard` — Tổng quan admin (read-only)
```ts
[Act] getDashboardStatsAction()   ← thống kê tổng (đếm project/product/news/contact…)
      DashboardOverview.tsx        ← biểu đồ + số liệu
```
Không có domain/infra riêng — chỉ tổng hợp số liệu từ các module khác.

---

## 4. Quan hệ dữ liệu (ERD) & liên kết module

```
            ┌──────────────────┐
            │  group           │  group_categories
            │ (Nhóm danh mục)  │
            └────────┬─────────┘
                     │ 1
                     │ groupId
                     ▼ N
            ┌──────────────────┐         M:N (project_type_category)        ┌──────────────────┐
            │  category-new    │◄───────────────────────────────────────────│  project-type    │
            │ (Danh mục dự án) │              categoryIds                    │ (Loại công trình)│
            │ project_category │                                            │  project_type    │
            └────────┬─────────┘                                            └────────┬─────────┘
                     │ 1                                                              │
                     │ categoryId                                          projectTypeId│
                     ▼ N                                                              ▼
            ┌─────────────────────────────────────────────────────────────────────────────┐
            │                          project  (projects)                                 │
            └─────────────────────────────────────────────────────────────────────────────┘

            ┌──────────────────┐                        ┌──────────────────┐
            │  category (CŨ)   │ 1   categoryId   N      │   brand          │
            │  categories      │────────────┐   ┌────────│   brands         │
            │  (self parentId) │            ▼   ▼ brandId └──────────────────┘
            └──────────────────┘     ┌──────────────────┐
                                     │ catalog (products)│
                                     └──────────────────┘

            ┌──────────────────┐        ┌──────────────────┐
            │  service-group   │ 1    N │   service        │
            │  service_groups  │────────│   services       │   groupId
            └──────────────────┘        └──────────────────┘

   Độc lập (không FK chéo): news · page(+about_blocks) · branch · contact · settings(site_settings)
```

**Liên kết module ở tầng application (gọi chéo nhau):**

```
service.getPublishedServicesGrouped()  ──►  service-group.getServiceGroups()
catalog.actions                        ──►  brand.actions (getBrands/createBrand)
project (FK)                           ──►  category-new, project-type
dashboard.getDashboardStatsAction()    ──►  (đếm) project, catalog, news, contact, …
app/(public)/page.tsx                  ──►  brand, catalog, contact, project, settings
app/(public)/layout.tsx                ──►  settings.getPublicLayoutData()
```

---

## 5. ADMIN PANEL — `app/(admin)`

Route group `(admin)`. Layout `app/(admin)/admin/(dashboard)/layout.tsx` gọi `getCurrentUser()`,
nếu chưa đăng nhập → redirect `/admin/login`. Sidebar: `shared/components/layout/admin/sidebar.tsx`.

```
/admin/login                         → auth.loginAction
/admin                    (Tổng quan)       → dashboard         · DashboardOverview
├ /admin/group-categories (Nhóm danh mục)   → group             · GroupManagement
├ /admin/categories       (Danh mục)        → category-new      · CategoryNewManagement
├ /admin/project-types    (Loại công trình) → project-type      · ProjectTypeManagement
├ /admin/brands           (Thương hiệu)     → brand             · BrandManagement
├ /admin/projects         (Dự án)           → project           · ProjectManagement
├ /admin/products         (Sản phẩm)        → catalog           · ProductManagement
├ /admin/service-groups   (Nhóm dịch vụ)    → service-group     · ServiceGroupManagement
├ /admin/services         (Dịch vụ)         → service (+service-group +category-new) · ServiceManagement
├ /admin/news             (Tin tức)         → news              · NewsManagement
├ /admin/pages            (Trang tĩnh)      → page              · PageManagement
├ /admin/contacts         (Liên hệ)         → contact           · ContactManagement
├ /admin/branches         (Chi nhánh)       → branch            · BranchManagement
└ /admin/settings         (Cài đặt)         → settings
```

Mỗi trang admin import 1 component `*Management` từ module tương ứng. Các Management component:
- Dùng `shared/components/ui/data-table.tsx` (TanStack Table) + `*Columns.tsx`.
- Form qua hook `use*Form.ts` (react-hook-form + zod resolver).
- Soạn nội dung qua `rich-text-editor` (TipTap) ở `shared/components/layout/admin/`.
- Gọi `*Action` (server actions) để ghi DB → `revalidatePath/Tag` để public cập nhật.

```
[Admin page] ─import─► modules/<x>/presentation/components/<X>Management.tsx
                              │ gọi
                              ▼
                       <x>Action (use server) ──► application ──► infrastructure ──► Supabase
                              │
                              ▼  revalidate → web public refresh
```

---

## 6. PUBLIC WEB — `app/(public)`

Route group `(public)`. Layout `app/(public)/layout.tsx` gọi `settings.getPublicLayoutData()`
để dựng header/footer. Phần lớn là Server Component (SSR/SSG) cho SEO.

```
/                         (Trang chủ)     → brand + catalog + contact + project + settings (sections/*)
/du-an                    (Dự án)         → project.ProjectListModule
/du-an/[slug]                             → project.resolveProjectPath + ProjectListModule + project-type
/san-pham                 (Sản phẩm)      → catalog.searchProducts + ProductCard/Filters + category(cũ)
/san-pham/[slug]                          → catalog.resolveProductPath + ProductDetailModule/ProductListModule
/dich-vu                  (Dịch vụ)       → service (getPublishedServicesGrouped)
/dich-vu/[slug]                           → service.getServiceBySlug
/tin-tuc                  (Tin tức)       → news.getNews
/tin-tuc/[slug]                           → news.getNewsBySlug
/chi-nhanh                (Chi nhánh)     → branch
/chi-nhanh/[slug]                         → branch.getBranchBySlug
/thong-tin                (Thông tin)     → page.getPages + branch.BranchList
/thong-tin/[slug]                         → page
/[slug]                   (Trang tĩnh)    → page.getPageBySlug   ← catch-all cuối cùng
/thank-you                                → trang cảm ơn sau khi gửi form (redirect-timer)
/gone                                     → 410 Gone (URL cũ đã xoá)
```

**API route:**
```
app/api/product-feed/route.ts   → catalog · xuất feed sản phẩm (Google Merchant / Facebook)
```

**SEO infra (app/):** `sitemap.ts`, `robots.ts`, `opengraph-image`, `not-found.tsx`,
`redirect-map.json` (301 từ web WordPress cũ), `proxy.ts` chặn bot.

**Sự khác biệt Admin vs Public ở tầng presentation:**

| | Admin Panel | Public Web |
|---|---|---|
| Route group | `app/(admin)` | `app/(public)` |
| Bảo vệ | `getCurrentUser()` → login | Mở công khai |
| Component | `*Management`, `*Columns` (CRUD) | `*Module`, `*Card`, `*Filters` trong `presentation/components/public/` |
| Render | Client-heavy (TanStack Table, form) | Server Component (SEO, cache, `revalidateTag`) |
| Thao tác | create/update/delete/toggle/order | get/search/resolvePath (chỉ đọc) |
| Layout | `sidebar.tsx` + breadcrumb admin | `header` + `footer` user |

---

## 7. Audit — cảnh báo

> Các điểm cần để mắt khi kiểm soát hệ thống. Không phải bug chặn chạy, nhưng là nợ kỹ thuật / nguồn rối.

1. **Hai hệ "category" song song — dễ nhầm:**
   - `modules/category` (bảng `categories`, có `parentId`, có `getCategoryTree`) → **chỉ phục vụ SẢN PHẨM** (catalog, trang `/san-pham`).
   - `modules/category-new` (bảng `project_category`, có `groupId`) → **phục vụ DỰ ÁN**, là menu Admin "Danh mục".
   - Tên `category` vs `category-new` gây hiểu lầm. Đề xuất: đổi tên rõ ràng (`product-category` / `project-category`) hoặc ghi chú cố định.

2. **Trùng chức năng Contact ở 2 module:** cả `modules/contact` và `modules/settings` đều có
   `createContact / getContacts / updateContact / deleteContact` (cùng bảng `contacts`).
   Admin "Liên hệ" dùng `contact`, còn `settings` cũng expose. → Nên gộp về 1 nguồn để tránh phân kỳ logic/validators.

3. **Path tuyệt đối hardcode trong code production:**
   `modules/project/presentation/actions.ts` (hàm `updateProjectAction`) ghi file debug vào
   `"/Users/tranvux/Documents/elc-tem/scratch/received-payload.json"` mỗi lần cập nhật dự án.
   → Đây là code debug bị bỏ quên: path máy cá nhân (khác cả thư mục hiện tại `elc-temp`),
   ghi đĩa mỗi request, lộ đường dẫn. **Nên xoá khối `fs.writeFileSync` này.**

4. **Thư mục legacy gần như rỗng ở root:**
   - `components/ui/button.tsx` (chỉ còn 1 file) — bản thật nằm ở `shared/components/ui/button.tsx`.
   - `lib/utils.ts` — bản thật ở `shared/lib/utils.ts`.
   - Không thấy nơi nào import `@/components/*` hay `@/lib/utils`. → Xoá được để tránh nhầm 2 nguồn.

5. **Soft-delete không nhất quán:** `service` / `service-group` dùng **soft-delete** (`softDelete` + `restore`,
   cờ `deleted_at`), trong khi `project` / `news` / `page`… dùng **hard delete** (`delete`).
   → Cần thống nhất chính sách xoá (đặc biệt nếu cần khôi phục dữ liệu).

6. **`console.log` payload đầy đủ trong action production:** `createProjectAction`/`updateProjectAction`
   log nguyên `JSON.stringify(input)`. Ồn log + có thể lộ dữ liệu. Nên hạ mức / bỏ khi lên prod.

7. **Module rỗng/đang chuyển tiếp:** `category-new`, `group`, `project-type`, `service`, `service-group`
   không có file trong `application/` đặt tên riêng lẻ như các module cũ (logic gộp trong `application/index.ts`).
   Không sai, nhưng pattern không đồng nhất với `project`/`catalog` → khó đọc khi audit nhanh.

---

## 8. Bản đồ nhanh: Module → Bảng DB → Menu

| Module | Bảng Supabase | Admin menu | Public route |
|---|---|---|---|
| `auth` | (Supabase Auth) | /admin/login | — |
| `dashboard` | (tổng hợp) | Tổng quan | — |
| `group` | `group_categories` | Nhóm danh mục | — |
| `category-new` | `project_category` | Danh mục | (lọc dự án) |
| `project-type` | `project_type` (+`project_type_category`) | Loại hình công trình | /du-an/[slug] |
| `project` | `projects` | Dự án | /du-an, /du-an/[slug] |
| `brand` | `brands` | Thương hiệu | / (showcase) |
| `category` | `categories` | (qua sản phẩm) | /san-pham |
| `catalog` | `products` | Sản phẩm | /san-pham, /san-pham/[slug], /api/product-feed |
| `service-group` | `service_groups` | Nhóm dịch vụ | /dich-vu |
| `service` | `services` | Dịch vụ | /dich-vu, /dich-vu/[slug] |
| `news` | `news` | Tin tức | /tin-tuc, /tin-tuc/[slug] |
| `page` | `pages` (+`about_blocks`) | Trang tĩnh | /[slug], /thong-tin |
| `branch` | `branches` | Chi nhánh | /chi-nhanh, /chi-nhanh/[slug] |
| `contact` | `contacts` | Liên hệ | (form khách) |
| `settings` | `site_settings` (+`contacts`) | Cài đặt | layout public (header/footer) |
```
