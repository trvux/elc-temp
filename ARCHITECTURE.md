# Quy tac kien truc va Huong dan phat trien du an

Tai lieu nay thiet lap cac nguyen tac kien truc bat buoc phai tuan thu trong suot qua trinh phat trien va tai cau truc he thong.

## 1. Kien truc Domain-Driven Design (DDD) va phan chia Layer

Moi module phai duoc to chuc thanh 4 lop (layers) rieng biet. Moi lop chi dam nhan dung vai tro va nhiem vu cua minh, tranh gay ra coupling chat che (tight coupling):

### Lop Domain (Core Business)
- Vi tri: modules/[module-name]/domain/
- Nhiem vu: Dinh nghia cac Thuc the (Entities), Value Objects, cac ham kiem tra tinh hop le (Validators), kieu du lieu nghiep vu va cac giao dien Repository (Repository Interfaces).
- Quy tac phu thuoc: Lop nay doc lap hoan toan. Khong duoc import bat ky ma nguon nao tu cac lop Application, Infrastructure, Presentation hoac cac thu vien ben ngoai nhu Supabase.

### Lop Application (Dieu phoi Nghiemp vu)
- Vi tri: modules/[module-name]/application/
- Nhiem vu: Chua cac Use Cases hoac Command/Query Handlers de thuc thi cac chuc nang cua he thong.
- Quy tac phu thuoc: Chi duoc phep phu thuoc vao Lop Domain.
- Quy tac Dependency Inversion (DIP): Khong duoc phep import truc tiep phan hien thi repository tu Infrastructure. Moi Use Case phai nhan repository interface thong qua tham so (Dependency Injection) hoac qua Composition Root cua lop Presentation de su dung.

### Lop Infrastructure (Lop Ha tang)
- Vi tri: modules/[module-name]/infrastructure/
- Nhiem vu: Trien khai cac Repository Interfaces bang cach tuong tac voi co so du lieu (Supabase), he thong tep (fs), hoac cac ben thu ba.
- Quy tac phu thuoc: Phai phu thuoc vao Lop Domain de lay interface va cac thuc the nghiep vu. Khong duoc phu thuoc vao Presentation hay Application.

### Lop Presentation (Lop Giao dien)
- Vi tri: modules/[module-name]/presentation/
- Nhiem vu: Chua cac Server Actions (presentation/actions.ts), Custom Hooks (presentation/hooks/*), va cac React Components.
- Quy tac phu thuoc: Day la noi ket noi cac thanh phan. No duoc phep biet ve Infrastructure de lay instance thuc te cua Repository va truyen vao cac Use Case cua Application de khoi chay.
- Quy tac Single Responsibility (SRP): Server Actions chi nhan tham so, goi use case thuc thi, dieu phoi lam moi cache (revalidatePath) va tra ket qua hoac bat loi. Khong long cac logic nghiep vu hoac cac thao tac ha tang vao day.

## 2. Nguyen tac SOLID

- Single Responsibility Principle (SRP): Moi lop hoac ham chi giai quyet dung mot trach nhiem duy nhat.
- Open/Closed Principle (OCP): Code phai de dang mo rong ma khong can thay doi ben trong.
- Liskov Substitution Principle (LSP): Cac lop con phai co the thay the lop cha ma khong lam hong tinh dung dan cua chuong trinh.
- Interface Segregation Principle (ISP): Chia nho cac interface thanh nhieu interface chuyen biet phu hop cho tung client.
- Dependency Inversion Principle (DIP): Moduel cap cao khong phu thuoc vao module cap thap, ca hai phai phu thuoc vao abstraction (giao dien/interface).

## 3. Quy tac Code TypeScript va Phat trien bat buoc

- Khong su dung kieu any: Nghiem cam su dung kieu any trong toan bo ma nguon TypeScript. Thay vao do, hay su dung kieu du lieu cu the, kieu unknown hoac generic khi can bieu dien kieu chua xac dinh.
- Khong su dung ky tu hinh anh (Visual Symbols): Tuyet doi khong su dung emoji, icon hoac ky tu bieu thi hinh anh nao trong bat ky tai lieu hoac phan giai thich nao de bao dam tinh chuan xac.
