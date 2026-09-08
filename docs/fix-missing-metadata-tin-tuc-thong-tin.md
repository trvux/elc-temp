# Fix: `/tin-tuc`, `/tin-tuc/[slug]`, `/thong-tin`, `/thong-tin/[slug]` thiếu `generateMetadata` — cùng loại bug đã fix cho `/du-an/` và `/dich-vu/`

Status: Done — implemented 2026-09-08, verified via `tsc`/`eslint` clean and local curl (distinct title/description on all 4 routes, tested against real slugs from local Go API). `getExcerptFromContent` exported to `shared/lib/rich-text.ts`. Pending: GSC Request Indexing after deploy (see "Verify sau khi fix" below).

## Bối cảnh

Phát hiện trong lúc research vì sao CTR = 0% ở hàng loạt query đang rank
tốt (vị trí 6-14). Ví dụ: query "cách sử dụng remote máy lạnh" (51
impressions, vị trí 6.9) trỏ tới
`/tin-tuc/top-5-sai-lam-khi-su-dung-may-lanh-ma-nhieu-nguoi-mac-phai` — bài
này trước đây (URL cũ thời WordPress) từng đạt **193 click** cho đúng nhóm
query remote máy lạnh, còn bây giờ **0 click tuyệt đối** trên tất cả các
query trỏ vào nó, dù vẫn giữ vị trí tốt.

Kiểm tra `curl` trực tiếp phát hiện nguyên nhân — **y hệt bug đã fix ở
`fix-missing-metadata-du-an-dich-vu.md`**: route `/tin-tuc` không có
`generateMetadata`, mọi trang tin tức (danh sách lẫn chi tiết) đều trả về
title/description mặc định của trang chủ:

```
<title>Mua Bán, Thi Công, Dịch Vụ Máy Lạnh &amp; Khí Tươi | Điện Máy ELC</title>
```

Verify bằng `grep -n "generateMetadata" app/(public)/tin-tuc/page.tsx
app/(public)/tin-tuc/[slug]/page.tsx` → không match dòng nào. Kết quả: khi
người tìm "cách sử dụng remote máy lạnh" thấy trên Google 1 tiêu đề hoàn
toàn không liên quan ("Mua Bán, Thi Công..."), họ không bấm vào dù bài
viết xếp hạng tốt — mất trắng traffic dù đã có vị trí.

`modules/news/domain/types.ts` đã có sẵn `metaTitle`, `metaDescription`,
`excerpt` (dòng 22-23, 40-41) — dữ liệu có sẵn hoặc dev điền được qua admin,
chỉ là chưa được đọc ra ở trang public.

**Phát hiện thêm, cùng lúc research CTR**: query chính là tên thương hiệu
**"dien may elc" đang xếp hạng #1 nhưng CTR = 0%** (0 click / 16 impressions,
và 1 biến thể khác cũng pos ~1 / 15 impr / 0 click) — bất thường nặng, vì
brand query ở #1 bình thường CTR phải 60-90%+. Query này trỏ tới cả
`/thong-tin` và `/thong-tin/van-phong`, và cả 2 đều dính **đúng bug tương
tự**: route `/thong-tin` (danh sách chi nhánh) và `/thong-tin/[slug]` (chi
tiết 1 chi nhánh — văn phòng, showroom, kho...) cũng không có
`generateMetadata`, cùng trả về title trang chủ. `modules/branch/domain/types.ts`
cũng đã có sẵn `metaTitle`/`metaDescription` (dòng 29-30, 53-54) chưa được
dùng. Gộp fix luôn vào ticket này vì cùng loại bug, cùng buổi.

(`co-so-ha-tang` không phải trang riêng — chỉ redirect 308 sang
`/thong-tin#branches-section`, không cần sửa.)

## Việc cần làm

### 1. `app/(public)/tin-tuc/page.tsx` (listing gốc)

`export const metadata` tĩnh, theo đúng pattern `du-an/page.tsx` /
`dich-vu/page.tsx`:

```ts
import type { Metadata } from "next";
import { BASE_URL } from "@/shared/lib/seo-schema";

export const metadata: Metadata = {
  title: "Tin tức & kiến thức điện lạnh | Điện máy ELC",
  description: "Cập nhật kiến thức kỹ thuật, hướng dẫn sử dụng và bảo trì máy lạnh, điều hòa, hệ thống khí tươi từ đội ngũ kỹ sư Điện máy ELC.",
  alternates: { canonical: `${BASE_URL}/tin-tuc` },
};
```

### 2. `app/(public)/tin-tuc/[slug]/page.tsx` (chi tiết bài viết)

Thêm `generateMetadata`, dùng `getCachedNewsDetailData(slug)` đã có sẵn
trong file để lấy `newsItem`, fallback description bằng hàm
`getExcerptFromContent` — hàm này **đã viết đúng, xử lý tốt cả Tiptap JSON
lẫn string, nhưng hiện chỉ định nghĩa cục bộ trong `tin-tuc/page.tsx`**
(dòng 41-94), không export dùng chung. Chuyển hàm này ra file share (gợi ý:
`@/shared/lib/rich-text.ts`, cạnh `excerptFromRichText` đã dùng cho
san-pham/category — hoặc file riêng `@/shared/lib/news-excerpt.ts` nếu
không muốn đụng file rich-text chung) rồi import vào cả 2 nơi
(`tin-tuc/page.tsx` và `tin-tuc/[slug]/page.tsx`) thay vì định nghĩa lại.

```ts
import type { Metadata } from "next";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { getExcerptFromContent } from "@/shared/lib/rich-text"; // sau khi export ra

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { newsItem } = await getCachedNewsDetailData(slug);
  if (!newsItem || !newsItem.isPublished) return {};

  const title = newsItem.metaTitle || `${newsItem.title} | Điện máy ELC`;
  const description = newsItem.metaDescription || getExcerptFromContent(newsItem.content, undefined);
  const image = primaryImageUrl(newsItem.images);
  const pageUrl = `${BASE_URL}/tin-tuc/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: { type: "article", title, description, url: pageUrl, images: image ? [{ url: image }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}
```

Lưu ý: `getCachedNewsDetailData` hiện fetch khá nhiều thứ không cần cho
metadata (related products, related news...) — gọi lại nguyên hàm này
trong `generateMetadata` sẽ chạy trùng toàn bộ logic đó lần nữa (Next.js
không tự cache chéo giữa `generateMetadata` và page component trừ khi dùng
`React.cache`/`unstable_cache`). Kiểm tra xem pattern cache nào repo đang
dùng cho các trang khác đã fix (`san-pham/[slug]`, `dich-vu/[slug]`) rồi
làm nhất quán — không tự bịa cách mới. Nếu đơn giản hơn, có thể chỉ gọi
`getNewsBySlugAction(slug)` riêng (nhẹ hơn) trong `generateMetadata` thay
vì gọi cả `getCachedNewsDetailData`.

### 3. `app/(public)/thong-tin/page.tsx` (danh sách chi nhánh)

`export const metadata` tĩnh:

```ts
import type { Metadata } from "next";
import { BASE_URL } from "@/shared/lib/seo-schema";

export const metadata: Metadata = {
  title: "Thông tin liên hệ & chi nhánh | Điện máy ELC",
  description: "Địa chỉ văn phòng, showroom, kho bãi kỹ thuật của Điện máy ELC — thông tin liên hệ, bản đồ và giờ làm việc từng chi nhánh.",
  alternates: { canonical: `${BASE_URL}/thong-tin` },
};
```

### 4. `app/(public)/thong-tin/[slug]/page.tsx` (chi tiết 1 chi nhánh)

Thêm `generateMetadata`, tái dùng `getBranchBySlugAction(slug)` đã có sẵn
trong file (đỡ phải gọi lại toàn bộ `getBranchData` — hàm đó còn fetch
`getPublicLayoutData()` không cần cho metadata):

```ts
import type { Metadata } from "next";
import { BASE_URL } from "@/shared/lib/seo-schema";
import { primaryImageUrl } from "@/shared/lib/image-asset";
import { excerptFromRichText } from "@/shared/lib/rich-text";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const branch = await getBranchBySlugAction(slug).then(unwrapActionResult);
  if (!branch || !branch.isPublished) return {};

  const title = branch.metaTitle || `${branch.name} | Điện máy ELC`;
  const description = branch.metaDescription || excerptFromRichText(branch.description) || branch.address;
  const image = primaryImageUrl(branch.images);
  const pageUrl = `${BASE_URL}/thong-tin/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: { type: "website", title, description, url: pageUrl, images: image ? [{ url: image }] : undefined },
  };
}
```

Kiểm tra `unwrapActionResult` import path khớp với cách file này đang dùng
(page.tsx hiện chưa import trực tiếp, chỉ `getBranchData` nội bộ dùng) —
thêm import nếu cần.

## Không cần làm

- Không cần sửa admin form — `metaTitle`/`metaDescription` đã có sẵn field
  trong domain, chỉ cần kiểm tra admin UI (News management) đã có ô nhập
  chưa; nếu thiếu thì đó là ticket phụ riêng, không nằm trong scope sửa bug
  này.

## Verify sau khi fix

```bash
for url in \
  "https://dienmayelc.com.vn/tin-tuc" \
  "https://dienmayelc.com.vn/tin-tuc/top-5-sai-lam-khi-su-dung-may-lanh-ma-nhieu-nguoi-mac-phai" \
  "https://dienmayelc.com.vn/tin-tuc/dieu-gi-dang-an-trong-chiec-may-lanh-khong-duoc-ve-sinh-suot-1-nam" \
  "https://dienmayelc.com.vn/thong-tin" \
  "https://dienmayelc.com.vn/thong-tin/van-phong" \
  ; do
  echo "$url"
  curl -s "$url" | grep -oE '<title>[^<]*</title>'
done
```

Kỳ vọng: mỗi URL ra title riêng biệt, không còn trùng trang chủ. Sau khi
deploy, GSC → URL Inspection → Request Indexing cho các URL trên (đặc biệt
bài remote máy lạnh, vệ sinh máy lạnh, và `/thong-tin/van-phong` — nơi
đang mất trắng click ngay cả cho query thương hiệu "dien may elc" ở vị trí
#1) để đẩy nhanh crawl lại thay vì chờ tự nhiên.
