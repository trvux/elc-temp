# Fix: `/du-an/*` và `/dich-vu/*` thiếu `generateMetadata` — toàn bộ trang trùng title/description với trang chủ

Status: Done — `generateMetadata`/`metadata` added to all 4 route files (2026-09-08), verified live against local dev + Go API backend for both `project_type` and `project` cases under `/du-an/[slug]`, both service slugs under `/dich-vu/[slug]`, and both listing pages. Admin forms for Project and ProjectType already have `metaTitle`/`metaDescription` UI, so no follow-up needed there. Deploy + GSC re-indexing steps below are still outstanding.

## Bối cảnh

Phát hiện trong lúc audit SEO (site rớt hạng nghiêm trọng sau khi migrate từ WordPress
sang Next.js/Golang tháng 3/2026). Kiểm tra title tag thực tế trên production:

```
/san-pham/may-cap-khi-tuoi-thu-hoi-nhiet   -> title RIÊNG, tối ưu tốt ✓
/du-an/co-so-kinh-doanh                     -> title = title trang chủ ✗
/du-an/cong-trinh-cong-nghiep               -> title = title trang chủ ✗
/du-an/y-te                                 -> title = title trang chủ ✗
/du-an  (listing gốc)                       -> title = title trang chủ ✗
/dich-vu/ve-sinh-bao-tri-cac-dong-may-lanh  -> title = title trang chủ ✗
/dich-vu/cung-cap-lap-dat-cac-dong-may-lanh -> title = title trang chủ ✗
```

Title/description hiện tại (rớt về default của root layout) trên MỌI trang trên:

```html
<title>Mua Bán, Thi Công, Dịch Vụ Máy Lạnh &amp; Khí Tươi | Điện Máy ELC</title>
<meta name="description" content="Cung cấp máy lạnh, hệ thống cấp khí tươi thu hồi nhiệt Menred, lọc nước chính hãng. Nhận thi công công trình, sửa chữa, bảo trì, vệ sinh máy lạnh.">
```

**Nguyên nhân đã xác định**: `app/(public)/san-pham/[slug]/page.tsx` có export
`generateMetadata` (dùng `metaTitle`/`metaDescription` của product/category/brand,
fallback sang excerpt nội dung nếu admin chưa nhập). 4 file route tương ứng của
`du-an` và `dich-vu` **không có** `generateMetadata` nào cả — đã verify bằng
`grep -n generateMetadata` trên cả 4 file, không match dòng nào.

**Tin tốt**: DB đã có sẵn field `metaTitle`/`metaDescription` cho cả `Project`,
`ProjectType`, và `Service` (xem `modules/project/domain/types.ts`,
`modules/project-type/domain/types.ts`, `modules/service/domain/types.ts`), và
admin form của Service đã có UI nhập 2 field này (`ServiceManagement.tsx` dòng
~790-811). Tức là **không cần thêm cột DB, không cần sửa admin form** — chỉ cần
nối `generateMetadata` ở 4 file route, y hệt pattern `san-pham` đã làm.

**Tác động ước tính**: ~60+ trang project detail + ~10 trang project_type
(phân khúc công trình: cơ sở giáo dục, cơ sở kinh doanh, công trình công nghiệp,
trụ sở cơ quan, văn phòng, y tế, biệt thự, nhà hàng/tiệc cưới, nhà phố, chung cư)
+ N trang service detail + 2 trang listing gốc (`/du-an`, `/dich-vu`) — tất cả
đang cùng 1 title, khiến Google không phân biệt được các trang này với nhau lẫn
với trang chủ.

## Việc cần làm

Tham khảo trực tiếp pattern đã đúng ở
`app/(public)/san-pham/[slug]/page.tsx` (hàm `metadataForEntity` dòng 21-86 +
`generateMetadata` dòng 132-153) — copy đúng tinh thần đó, không cần bịa cách mới.

### 1. `app/(public)/du-an/[slug]/page.tsx`

File này resolve slug ra 1 trong 2 loại (xem `resolveProjectPathFromDb` ở
`modules/project/presentation/resolveProjectPath.ts`):
- `{ type: "project_type", data: ProjectTypeWithCategories }` — trang listing
  theo phân khúc (vd `/du-an/cong-trinh-cong-nghiep`)
- `{ type: "project", data: ProjectWithCategory }` — trang case study 1 dự án

Thêm `generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata>`:

- Gọi `resolveProjectPathFromDb(slug)` giống trong `default function` bên dưới
  (cân nhắc factor ra 1 hàm dùng chung để không query DB 2 lần — hoặc cache
  bằng `React.cache`/`unstable_cache` nếu pattern này đã dùng ở chỗ khác trong
  repo, check trước khi tự bịa).
- Nếu không tìm thấy entity: return `{}` (để Next.js tự render `notFound()` với
  metadata mặc định, giống cách `san-pham` xử lý case `!entity`).
- Case `project_type`:
  - `title = data.metaTitle || `Dự án ${data.name} | Điện máy ELC``
  - `description = data.metaDescription || <viết 1 câu mô tả dựa trên data.name, kiểu "Các công trình thi công hệ thống điều hòa, khí tươi tại phân khúc ${data.name} do Điện máy ELC thực hiện.">`
    — check field `description` có tồn tại trên `ProjectTypeWithCategories`
    không (đọc `modules/project-type/domain/types.ts`), nếu có thì ưu tiên
    excerpt từ đó thay vì câu template cứng.
  - `alternates.canonical = `${BASE_URL}/du-an/${slug}``
- Case `project`:
  - `title = data.metaTitle || `${data.title} | Điện máy ELC``
  - `description = data.metaDescription || excerptFromRichText(data.description)`
    (dùng đúng util `excerptFromRichText` từ `@/shared/lib/rich-text`, vì
    `Project.description` là kiểu `Json` richtext giống product, không phải
    plain string)
  - `image = primaryImageUrl(data.images)` (dùng lại `@/shared/lib/image-asset`)
  - `alternates.canonical = `${BASE_URL}/du-an/${slug}``
  - Thêm `openGraph`/`twitter` block giống san-pham (title/description/image)
- Import `BASE_URL` từ `@/shared/lib/seo-schema` (path đã dùng ở san-pham).

### 2. `app/(public)/du-an/page.tsx`

Listing gốc, hiện chỉ có 12 dòng, không có metadata gì. Thêm:

```ts
export const metadata: Metadata = {
  title: "Dự án đã thi công | Điện máy ELC",
  description: "Hơn 60 công trình thi công hệ thống điều hòa không khí, cấp khí tươi thu hồi nhiệt do Điện máy ELC thực hiện — nhà xưởng, văn phòng, chung cư, biệt thự, cơ sở kinh doanh.",
  alternates: { canonical: `${BASE_URL}/du-an` },
};
```

(Có thể dùng `export const metadata` tĩnh vì trang này không phụ thuộc params —
không cần `generateMetadata` async ở đây, đơn giản hơn.)

### 3. `app/(public)/dich-vu/[slug]/page.tsx`

`service` lấy từ `getServiceBySlugAction(slug)` — field đã có sẵn
`metaTitle`/`metaDescription`/`description` (plain string, KHÔNG phải richtext
— khác với Project) trên `ServiceWithRelations`. Thêm:

```ts
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getCachedService(slug);
  if (!service) return {};

  const title = service.metaTitle || `${service.title} | Điện máy ELC`;
  const description = service.metaDescription || service.description || undefined;
  const image = primaryImageUrl(service.images);
  const pageUrl = `${BASE_URL}/dich-vu/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: { type: "website", title, description, url: pageUrl, images: image ? [{ url: image }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}
```

`getCachedService` đã tồn tại sẵn trong file này (dòng 23-25) — tận dụng luôn,
không query DB thêm lần nữa.

### 4. `app/(public)/dich-vu/page.tsx`

Listing gốc dùng `export const metadata` tĩnh, tương tự `du-an/page.tsx`:

```ts
export const metadata: Metadata = {
  title: "Dịch vụ máy lạnh & hệ thống khí tươi | Điện máy ELC",
  description: "Giải pháp chuyên nghiệp cho hệ thống lạnh công nghiệp, điều hòa trung tâm và bảo trì hệ thống — lắp đặt, sửa chữa, vệ sinh, bảo trì máy lạnh.",
  alternates: { canonical: `${BASE_URL}/dich-vu` },
};
```

(Description có thể tái dùng nguyên câu đang render trong `PageHero` ở file
này, dòng 70 — đã viết sẵn khá tốt, chỉ là chưa lên `<meta>`.)

## Việc KHÔNG cần làm

- Không cần thêm field DB mới — `metaTitle`/`metaDescription` đã tồn tại trên
  cả 3 model (Project, ProjectType, Service).
- Không cần sửa admin form cho Service (đã có UI nhập metaTitle/metaDescription
  ở `ServiceManagement.tsx`). Kiểm tra xem admin form của **Project** và
  **ProjectType** có UI tương tự chưa — nếu chưa, đó là việc phụ, không phải
  trọng tâm ticket này, nhưng nên note lại nếu thấy thiếu.

## Verify sau khi fix

```bash
for url in \
  "https://dienmayelc.com.vn/du-an" \
  "https://dienmayelc.com.vn/du-an/cong-trinh-cong-nghiep" \
  "https://dienmayelc.com.vn/du-an/co-so-kinh-doanh" \
  "https://dienmayelc.com.vn/du-an/y-te" \
  "https://dienmayelc.com.vn/du-an/lap-dat-he-thong-dieu-hoa-khong-khi-cho-cau-lac-bo-bida-hoang-sao-quan-tan-phu" \
  "https://dienmayelc.com.vn/dich-vu" \
  "https://dienmayelc.com.vn/dich-vu/ve-sinh-bao-tri-cac-dong-may-lanh" \
  "https://dienmayelc.com.vn/dich-vu/cung-cap-lap-dat-cac-dong-may-lanh" \
  ; do
  echo "$url"
  curl -s "$url" | grep -o '<title>[^<]*</title>'
done
```

Kỳ vọng: mỗi URL ra 1 title khác nhau, không còn URL nào lặp lại title trang chủ.

Sau khi deploy: vào GSC → URL Inspection → test lại vài URL trên, bấm "Request
Indexing" cho khoảng 10-15 URL giá trị cao nhất (theo
`seo-audit/data/gsc_top_pages_wordpress_era.csv` hoặc query GSC theo path
`/du-an/` và `/dich-vu/`) để đẩy nhanh crawl lại thay vì chờ Googlebot tự ghé
theo lịch sitemap.
