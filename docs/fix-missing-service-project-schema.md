# Fix: `/dich-vu/*` và `/du-an/*` thiếu structured data (Service schema) — hàm đã viết sẵn nhưng chưa được gọi

Status: Done (2026-09-08) — cả 3 phần đã wire xong: `getService()` gọi trong
`ServiceDetailModule.tsx`, `SEOSchema.getProject()` viết mới trong
`shared/lib/seo-schema.ts`, gọi trong `ProjectDetailView`
(`du-an/[slug]/page.tsx`). `tsc --noEmit` + `eslint` sạch. Verify local dev:
cả 2 script tag đều valid JSON và có `"@context":"https://schema.org"` (thêm
tại call site, giống pattern `ProductDetailModule.tsx` — `getService()`/
`getProject()` tự thân không trả `@context`, đúng convention các hàm
`SEOSchema.get*` khác trong file). `curl` cả 2 URL mẫu (local, cùng slug) ra
đúng `"@type":"Service"`. Review chưa xuất hiện vì 0/71 project có
testimonial — đúng như dự kiến. **Chưa deploy production**, chưa chạy Rich
Results Test.

## Bối cảnh

Audit SEO phát hiện: trang sản phẩm (`/san-pham/[slug]`) có JSON-LD `Product`
schema rất đầy đủ (Offer, Brand, SKU, giá, chính sách đổi trả — xem
`modules/catalog/presentation/components/public/ProductDetailModule.tsx`
dòng ~429-479), nhưng `/dich-vu/[slug]` và `/du-an/[slug]` chỉ có schema
chung (`Organization`, `WebSite`, `BreadcrumbList` — gắn ở `app/layout.tsx`),
không có schema riêng mô tả đúng bản chất trang (đây là 1 dịch vụ / 1 dự án
đã thực hiện).

**Phát hiện quan trọng**: `shared/lib/seo-schema.ts` đã có sẵn hàm
`SEOSchema.getService(svc: ServiceInput)` (dòng 219-244) — viết đầy đủ,
đúng chuẩn Schema.org (`@type: "Service"`, `provider`, `areaServed`) — nhưng
**verify bằng `grep -rn "SEOSchema.getService"` trên toàn repo: 0 lượt gọi
ngoài định nghĩa của chính nó**. Y hệt kiểu bug đã fix trước đó ở
`fix-missing-metadata-du-an-dich-vu.md` — code đúng, chỉ là chưa được wire
vào page nào cả.

## Việc cần làm

### 1. Wire `getService()` vào `ServiceDetailModule.tsx`

File: `modules/service/presentation/components/public/ServiceDetailModule.tsx`

Thêm import:
```ts
import { SEOSchema, toJsonLdHtml } from "@/shared/lib/seo-schema";
```

Trong component `ServiceDetailModule`, trước đoạn `return (`, thêm:
```ts
const serviceSchema = SEOSchema.getService({
  title: service.title,
  slug: service.slug,
  metaDescription: service.metaDescription,
});
```

Trong JSX trả về, thêm ngay sau dòng `<TrackView ... />` (dòng ~90, theo đúng
vị trí `ProductDetailModule.tsx` đặt script Product schema của nó):
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdHtml(serviceSchema) }} />
```

### 2. Viết mới `SEOSchema.getProject()` trong `shared/lib/seo-schema.ts`

Không có hàm tương đương cho project — viết mới, theo đúng tinh thần
`getService()` ở trên (cùng file, thêm vào cuối object `SEOSchema` trước
dấu `}` đóng):

```ts
export interface ProjectInput {
  title: string;
  slug: string;
  description?: string; // excerpt, không phải richtext gốc
  location?: string;
  images?: { url: string }[];
  testimonialQuote?: string;
  testimonialAuthor?: string;
  clientName?: string;
}

// ... trong object SEOSchema, thêm:
getProject(project: ProjectInput) {
  return {
    "@type": "Service",
    "@id": `${BASE_URL}/du-an/${project.slug}#service`,
    "name": project.title,
    "description": project.description || undefined,
    "url": `${BASE_URL}/du-an/${project.slug}`,
    "image": primaryImageUrl(project.images) || undefined,
    "provider": {
      "@id": `${BASE_URL}/#organization`,
    },
    ...(project.location ? {
      "areaServed": {
        "@type": "AdministrativeArea",
        "name": project.location,
      },
    } : {}),
    // Chỉ thêm review khi ĐÃ có testimonial thật — không tự bịa placeholder,
    // tránh vi phạm Google structured data guidelines (dữ liệu không đúng
    // thực tế trang hiển thị). Field này sẽ tự động xuất hiện dần khi nhân
    // viên điền testimonial theo brief content_brief_eeat_projects.md.
    ...(project.testimonialQuote ? {
      "review": {
        "@type": "Review",
        "reviewBody": project.testimonialQuote,
        "author": {
          "@type": "Person",
          "name": project.testimonialAuthor || project.clientName || "Khách hàng",
        },
      },
    } : {}),
  };
},
```

Dùng `excerptFromRichText` (từ `@/shared/lib/rich-text`, đã dùng ở
`san-pham/[slug]/page.tsx`) để convert `project.description` (kiểu `Json`
richtext) sang plain string trước khi truyền vào `getProject()` — đừng
truyền thẳng object richtext vào field `description` của schema.

### 3. Wire `getProject()` vào trang chi tiết dự án

File: `app/(public)/du-an/[slug]/page.tsx`, trong component
`ProjectDetailView` (dòng ~60-237 theo lần đọc trước).

Thêm import:
```ts
import { SEOSchema, toJsonLdHtml } from "@/shared/lib/seo-schema";
import { excerptFromRichText } from "@/shared/lib/rich-text";
```

Trước `return (` trong `ProjectDetailView`, thêm:
```ts
const projectSchema = SEOSchema.getProject({
  title: project.title,
  slug: project.slug,
  description: excerptFromRichText(project.description),
  location: project.location,
  images: project.images,
  testimonialQuote: project.testimonialQuote,
  testimonialAuthor: project.testimonialAuthor,
  clientName: project.clientName,
});
```

Thêm vào JSX trả về, ngay sau `<TrackView ... />` (dòng ~89):
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdHtml(projectSchema) }} />
```

## Không cần làm

- Không cần sửa gì ở trang listing (`/dich-vu`, `/du-an` gốc, hay các trang
  project_type theo phân khúc) — schema riêng theo entity chỉ cần ở trang
  chi tiết (detail page), giống cách `Product` schema chỉ có ở trang sản
  phẩm chứ không có ở trang danh mục.
- Không cần thêm `aggregateRating` — chỉ có 1 review lẻ tẻ mỗi trang (không
  phải nhiều review cho cùng 1 entity), Google sẽ không hiện sao đánh giá
  trên SERP với review đơn lẻ kiểu này, nhưng vẫn là structured data hợp lệ,
  đúng thực tế, tăng tín hiệu E-E-A-T — không cần cố thêm rating giả.

## Verify sau khi fix

```bash
for url in \
  "https://dienmayelc.com.vn/dich-vu/ve-sinh-bao-tri-cac-dong-may-lanh" \
  "https://dienmayelc.com.vn/du-an/lap-dat-he-thong-dieu-hoa-khong-khi-cho-cau-lac-bo-bida-hoang-sao-quan-tan-phu" \
  ; do
  echo "$url"
  curl -s "$url" | grep -oE '"@type":"[A-Za-z]+"' | sort -u
  echo
done
```

Kỳ vọng: cả 2 URL trên giờ xuất hiện thêm `"@type":"Service"` (và
`"@type":"Review"` cho project nào đã có `testimonial_quote` — hiện tại 0/71
nên chưa thấy Review ngay, sẽ tự xuất hiện dần khi nhân viên điền theo
`content_brief_eeat_projects.md`).

Sau khi deploy, dùng [Rich Results Test](https://search.google.com/test/rich-results)
dán URL vào để Google tự đọc và xác nhận schema hợp lệ, không có lỗi cú pháp.
