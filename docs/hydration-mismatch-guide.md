# Hướng dẫn Khắc phục và Phòng ngừa Lỗi Trắng trang (Whitescreen) & Hydration Mismatch trong Next.js

Tài liệu này giải thích nguyên nhân gốc rễ và hướng dẫn chi tiết cách khắc phục, phòng ngừa lỗi trắng trang liên quan đến chỉ thị "use cache" và cơ chế truyền luồng (Streaming/Suspense) của Next.js khi hoạt động qua CDN (như Cloudflare).

---

## 1. Lỗi Xung đột Caching cấp Component (Component-level use cache)

### Hiện tượng
Trang web thỉnh thoảng bị trắng màn hình. Trong cửa sổ console của trình duyệt xuất hiện lỗi:
Uncaught HierarchyRequestError: Failed to execute 'insertBefore' on 'Node': The new child element contains the parent.

### Nguyên nhân gốc rễ
* Khi đặt chỉ thị "use cache" ở cấp độ Page Component hoặc UI Component, Next.js sẽ biên dịch và lưu trữ toàn bộ cây React Server Component (RSC) tĩnh cùng với chuỗi định danh thành phần (segment IDs như S:0, S:1, S:2...).
* Khi kết hợp trang đã cache này với một Layout động hoặc Suspense, React trên client-side thực hiện đối chiếu (hydration).
* Các định danh tĩnh bị trùng lặp với định danh động tạo ra từ layout (ví dụ: cả hai đều dùng ID "S:3"). Trình duyệt cố gắng chèn phần tử cha vào bên trong chính con của nó dẫn đến sập DOM và trắng trang.

### Quy tắc khắc phục
* **Không dùng Caching cấp Component**: Tuyệt đối không đặt "use cache" ở đầu Page Component hoặc UI Component. Hãy để các trang công khai làm Server Component động bình thường.
* **Chuyển sang Caching cấp Dữ liệu (Data-level)**: Đưa chỉ thị "use cache" xuống các hàm helper lấy dữ liệu (ví dụ: getCachedHomeData, getCachedNewsHubData...). Các hàm này chỉ trả về dữ liệu thô (mảng, object, chuỗi, số...) đã được tuần tự hóa (serializable).
* **Xử lý các giá trị động**: Các giá trị động như năm hiện tại (new Date().getFullYear()) dùng ở footer, nếu đặt trực tiếp trong render tĩnh của một trang không cache sẽ gây lỗi build prerender. Hãy đưa việc lấy năm hiện tại vào trong một hàm helper có "use cache" riêng.

---

## 2. Lỗi Xung đột Cơ chế Truyền luồng (Streaming/Suspense) với CDN (Cloudflare)

### Hiện tượng
Mặc dù đã chuyển "use cache" xuống cấp dữ liệu nhưng trang vẫn bị lỗi HierarchyRequestError và trắng trang không liên tục (ví dụ: tải lại trang 4-5 lần thì có 1 lần hiển thị bình thường). Lỗi này chỉ xảy ra trên môi trường production chạy qua Cloudflare, không bị ở môi trường local.

### Nguyên nhân gốc rễ
* Khi trang sử dụng thẻ `<Suspense fallback={<ProductListSkeleton />}>` bao quanh phần hiển thị chính, Next.js sẽ kích hoạt cơ chế **Streaming**. Máy chủ gửi phần khung tĩnh trước, sau đó gửi tiếp các khối HTML sản phẩm kèm theo các thẻ script nội tuyến đặc biệt (như `$RC` và `$RV`) qua đường truyền để trình duyệt ghép nối vào DOM.
* Nếu Cloudflare bật các tính năng tối ưu hóa như **Rocket Loader** hoặc **Auto Minify HTML** (kể cả khi tính năng Auto Minify đã bị ẩn/deprecated trên giao diện của Cloudflare đối với các tên miền cũ nhưng vẫn chạy ngầm ở backend), Cloudflare sẽ tạm giữ (buffer) luồng HTML để nén và gộp file script trước khi gửi về cho khách hàng.
* Việc tạm giữ luồng dữ liệu làm đảo lộn thứ tự thực thi của các script ghép nối DOM của Next.js. Trình duyệt chạy script khi DOM chưa sẵn sàng, dẫn đến lỗi HierarchyRequestError.

### Quy tắc khắc phục
* **Tắt cơ chế truyền luồng (Disable Streaming)** cho các trang gặp lỗi bằng cách loại bỏ thẻ `<Suspense>` bao ngoài component hiển thị chính, và giải quyết tham số trực tiếp (ví dụ: sử dụng `const params = await searchParams` ngay trong Page component chính trước khi render view).
* Khi không có `<Suspense>`, Next.js sẽ dựng toàn bộ trang HTML hoàn chỉnh trên máy chủ rồi gửi về trình duyệt trong một phản hồi duy nhất (single blocking HTML response). Cloudflare sẽ nhận được trang HTML hoàn chỉnh và không có luồng script ghép nối động nào để can thiệp, giúp trang web hiển thị ổn định 100%.
* Vì dữ liệu đã được cache ở cấp độ dữ liệu (tốc độ đọc cache từ bộ nhớ chỉ dưới 10ms), thời gian dựng trang trên máy chủ cực kỳ nhanh nên việc tắt Suspense hoàn toàn không ảnh hưởng đến trải nghiệm tốc độ của người dùng.

---

## 3. Ví dụ minh họa mã nguồn

### Mô hình sai (Gây lỗi trắng trang do cache component & streaming):
```tsx
// app/san-pham/page.tsx
export default async function ProductsPage() {
  "use cache"; // SAI: Caching cấp component gây trùng ID
  
  const products = await getProducts();
  return (
    <Suspense fallback={<Skeleton />}> {/* Gây lỗi streaming qua Cloudflare */}
      <ProductList products={products} />
    </Suspense>
  );
}
```

### Mô hình chuẩn (Hoạt động ổn định 100%):
```tsx
// app/san-pham/page.tsx
import { cacheLife } from "next/cache";

// 1. Caching cấp dữ liệu
async function getCachedProductsData() {
  "use cache";
  cacheLife("hours");
  const products = await getProducts();
  const currentYear = new Date().getFullYear();
  return { products, currentYear };
}

// 2. Page Component động hoàn toàn, không streaming
export default async function ProductsPage({ searchParams }: Props) {
  // Await trực tiếp searchParams để bỏ qua streaming
  const params = await searchParams;
  const { products, currentYear } = await getCachedProductsData();

  return (
    <main>
      <ProductList products={products} />
      <footer>&copy; {currentYear} ELC.</footer>
    </main>
  );
}
```

---

## 4. Danh sách các trang đã được áp dụng trong dự án

* Trang chủ: `app/(public)/page.tsx`
* Trang thông tin tĩnh: `app/(public)/[slug]/page.tsx`
* Trang danh sách dự án: `modules/project/presentation/components/public/ProjectListModule.tsx`
* Chi tiết dự án: `app/(public)/du-an/[slug]/page.tsx`
* Danh sách sản phẩm chính: `app/(public)/san-pham/page.tsx`
* Chi tiết & danh mục sản phẩm: `app/(public)/san-pham/[slug]/page.tsx`
* Chi tiết sản phẩm: `modules/catalog/presentation/components/public/ProductDetailModule.tsx`
* Danh sách & Chi tiết dịch vụ: `app/(public)/dich-vu/page.tsx` và `app/(public)/dich-vu/[slug]/page.tsx`
* Danh sách & Chi tiết tin tức: `app/(public)/tin-tuc/page.tsx` và `app/(public)/tin-tuc/[slug]/page.tsx`
* Danh sách & Chi tiết chi nhánh: `app/(public)/chi-nhanh/page.tsx` và `app/(public)/chi-nhanh/[slug]/page.tsx`
* Danh sách & Chi tiết trang thông tin: `app/(public)/thong-tin/page.tsx` và `app/(public)/thong-tin/[slug]/page.tsx`
