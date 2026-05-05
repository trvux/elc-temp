# Testing Strategy & Guidelines

Tài liệu này định nghĩa chiến lược, công cụ và cấu trúc thư mục để viết test cho dự án theo kiến trúc Modular Monolith. 

## 1. Stack Công Cụ Testing

### Unit & Integration Test (Logic & Nghiệp vụ)
- **Vitest**: Lựa chọn số 1 thay cho Jest khi dùng với Next.js/Vite. Tốc độ thực thi nhanh và hỗ trợ Native TypeScript rất tốt. Dùng để test Domain Logic, Services và Business Rules.
- **MSW (Mock Service Worker)**: Cực kỳ quan trọng để chặn các request API gửi đến Supabase và trả về mock data. Giúp test luồng gọi data mà không cần hit database thật, tiết kiệm quota và tăng tốc độ test.

### Component & UI Test (Giao diện)
- **React Testing Library (RTL)**: Thư viện tiêu chuẩn để test React Component theo triết lý "user-centric" (tập trung vào những gì user tương tác và nhìn thấy).
- **Playwright (Component Testing)**: Tùy chọn sử dụng khi cần test component trong môi trường trình duyệt thật (thay cho jsdom).

### End-to-End (E2E) Test (Toàn bộ luồng)
- **Playwright**: Framework mạnh mẽ nhất hiện tại để test E2E (từ click UI đến lúc lưu vào Supabase). Tốc độ cao, chạy song song tốt và giả lập Mobile dễ dàng.
- **Supabase Local Development**: Chạy Supabase qua Docker ở local để E2E test hoạt động trên database clone, đảm bảo tính độc lập và an toàn cho production/staging.

### Database Test (Chuyên biệt cho Supabase/PostgreSQL)
- **pgTAP**: Framework test trực tiếp bên trong PostgreSQL, dùng để test các logic ở Database (RLS Policies, Triggers, RPC).
- **Supabase CLI**: Sử dụng lệnh `supabase test db` để chạy các bài test pgTAP.

---

## 2. Testing Pyramid (Chiến Lược Phân Bổ)

| Tầng Test | Thư viện | Mục tiêu |
| :--- | :--- | :--- |
| **Unit** | Vitest | Test các hàm xử lý logic, tính toán, Domain Model. |
| **Integration** | Vitest + MSW | Test các luồng gọi API, Service Layer kết hợp với Supabase client (đã được mock). |
| **E2E** | Playwright + Docker | Test các tính năng quan trọng nhất (Happy path): Login, Checkout, CRUD. |
| **Database** | pgTAP | Test RLS Policies, đảm bảo bảo mật dữ liệu cấp dòng. |

---

## 3. Cấu Trúc Thư Mục Test

**Nguyên tắc cốt lõi:** Các file test phải được đặt chung bên trong thư mục của Module cần test (Co-location).

Khi viết test cho một module (ví dụ: `branch`), tạo một folder `__tests__` (hoặc `tests`) nằm ngay trong root của module đó, rồi mô phỏng lại các layer bên trong:

```text
modules/branch/
├── application/
├── domain/
├── infrastructure/
├── presentation/
└── __tests__/                 <-- Đặt folder test tại đây
    ├── application/           <-- Test cho Use Cases/Services
    ├── domain/                <-- Test cho Domain Models/Validators
    ├── infrastructure/        <-- Test cho Repository (MSW)
    └── presentation/          <-- Test cho React Components (RTL/Playwright)
```

Mỗi khi cần viết test, hãy tham chiếu đến tài liệu này để tuân thủ đúng tech stack và quy tắc cấu trúc.
