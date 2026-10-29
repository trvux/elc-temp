# Typography: chuyển dần sang tag + `type-*` (strangler fig)

**Status:** HOÀN THÀNH (2026-10-29). Lát 0 đến 13 xong cho mọi vùng, kể cả `header/` (menu, submenu). Chưa commit gì. Xem mục "Kết quả cuối".
**Quan hệ với v3:** thay phần typography của `typography-migration-plan.md` (v3, big-bang trên nhánh `redesign`). Phần shadcn/Base UI/component/trang của v3 không nằm trong tài liệu này.

## Quyết định đã chốt (2026-10-29)

1. **Hai trục độc lập như elc-v2**: tag HTML quyết định cấu trúc, `type-*` quyết định hình dạng chữ. Màu **không** nằm trong phạm vi: `type-*` không mang màu, màu giữ nguyên ở chỗ dùng (`text-muted-foreground`...), không theo dõi, không ánh xạ.
2. **Ép toàn bộ về `type-*`**, không chỉ 125 chỗ `Typography*` mà cả `text-<size>`, `font-<weight>`, `leading-*`, `tracking-*` rời. Gồm cả admin và `shared/components/ui`.
3. **Thay typography của elc bằng typography của elc-v2.** Chỗ nào thang elc-v2 thiếu thì scale thêm theo công thức của chính nó (xem "Thang chữ"), không bịa quy tắc mới.
4. **Strangler fig, đi từng vùng**, không big-bang. Mỗi vùng xong thì deploy được và revert được riêng.
5. **Font làm sau cùng**: xong typography mới gỡ Inter tự host (file của Linear) và dùng `next/font/google` Inter như lúc cài shadcn (lát 13).

6. **Giữ nguyên thang elc-v2 (số đo Apple), không chỉnh để khớp Tailwind.** Role chữ nhỏ có line-height khác Tailwind (`type-legal` 18px so với `text-xs` 16px, `type-body-sm` 21px so với `text-sm` 20px), nên chuyển hàng loạt sẽ làm dòng chữ nhỏ cao thêm 1 đến 2px, nhất là ở admin. Chấp nhận, vì admin sẽ dựng lại sau. Không sửa role để đuổi theo Tailwind.

Ngoài phạm vi: `.typeset` (rich text), JSON-LD, sitemap, llms.txt, text của `h1` các route hiện có (bảo vệ công SEO), màu sắc.

## Hiện trạng (đo bằng `scripts/typography-audit.py`, baseline `docs/typography-baseline-2026-10-29.json`)

| zone | file | cần chuyển | `<Typography*>` | `<h1-6>` thô | `text-*` | `font-*` | `leading/tracking` |
|---|---|---|---|---|---|---|---|
| public | 120 | 66 | 107 | 19 | 250 | 135 | 75 |
| admin | 137 | 76 | 18 | 69 | 449 | 245 | 128 |
| shared-ui | 75 | 45 | 0 | 0 | 120 | 52 | 17 |
| tổng | 339 | 187 | 125 | 88 | 819 | 432 | 220 |

Phân bố cỡ chữ rời (đếm theo chuỗi class): `text-sm` 353, `text-xs` 279, `text-2xl` 41, `text-lg` 23, `text-base` 21, `text-xl` 20, còn lại 8. Tức 632/750 là chữ 12px và 14px, chủ yếu weight thường (421). Chỉ 46 chuỗi có `text-*` responsive.

Điều cần biết (đọc từ `shared/components/ui/typography.tsx`): `Typography*` mang cả margin (`TypographyP` có `mt-6`, `TypographyH2` có `first:mt-0`) và `scroll-m-20`. `type-*` không có những thứ này, nên chuyển một chỗ là phải đưa margin ra chỗ dùng, nếu không bố cục xô lệch. Đây là rủi ro lớn nhất. (Màu thì bỏ qua theo quyết định 1.)

Chuyển là **đổi nhẹ giao diện** (thang cũ đo từ Linear, thang mới đo từ Apple), không giữ pixel. Mỗi vùng phải được người dùng nhìn và duyệt.

## Thang chữ

Nguồn: `elc-v2/app/globals.css`, chép sang `elc-temp/app/globals.css` (giữ hai file đồng bộ). 12 role gốc của elc-v2 và 4 role scale thêm.

Công thức của elc-v2, dùng để scale thêm: weight chỉ có 400/500/600; chữ <= 14px có line-height 1.4286 đến 1.5, cố định, không responsive; chữ 16px dùng line-height 1.6 (chừa chỗ cho dấu tiếng Việt); chữ >= 17px mới responsive theo md/lg.

```
          400 thường      500           600 đậm
  16px    type-body       -             type-body-strong   (mới)
  14px    type-body-sm    type-caption  type-label         (body-sm, label mới)
  12px    type-legal      -             type-tag           (tag mới)
```

Thêm 4 role mới vì dữ liệu: `text-sm` thường (215), `text-sm` đậm (74), `text-xs` đậm/vừa (64), `text-base` đậm/vừa (16) không có role nào trong thang gốc để chuyển sang. Weight `bold`/`extrabold`/`semibold` đều quy về 600, `medium` về 500.

## Ánh xạ cũ sang mới (chọn theo vai trò, không theo số px)

| Cũ | Mới | Ghi chú |
|---|---|---|
| `TypographyH1` (36/48) | `type-headline`; trang chủ `type-display` | giữ `<h1>` và text |
| `TypographyH2` (24/30) | `type-title` | |
| `TypographyH3` (20/24) | `type-heading` | |
| `TypographyP` (14/16, `mt-6`) | `type-body` | `mt-6` ra chỗ dùng |
| `TypographyLead` (18/20) | `type-subhead` hoặc `type-callout` | theo vai trò |
| `TypographyLarge` (16/18, w600) | `type-body-strong` hoặc `type-heading` | 7 chỗ, xem từng chỗ |
| `TypographySmall` (14, w500) | `type-caption` | 55 chỗ |
| `TypographyMuted` (14) | `type-body-sm` | màu giữ ở chỗ dùng |
| `text-sm` (thường) | `type-body-sm` | |
| `text-sm font-medium` | `type-caption` | |
| `text-sm font-semibold/bold` | `type-label` | |
| `text-xs` (thường) | `type-legal` | |
| `text-xs font-medium/semibold/bold` | `type-tag` | |
| `text-base font-semibold/bold` | `type-body-strong` | |
| `text-lg`/`text-xl` đậm | `type-heading` | |
| `text-2xl` đậm | `type-title` | |
| `text-3xl+` | `type-headline`/`type-display` | trường hợp riêng, 8 chỗ |
| giá | `type-price`, `type-price-lg` | `FormattedPrice` là seam |
| mã model/SKU/code | `type-mono` | |

Chỗ nào không khớp role nào: ghi vào "Việc mở" của lát đó, không tự thêm role.

## Cách strangler fig áp dụng ở đây

```
        +--------------------------------------------+
        |  elc-temp (luôn deploy được)               |
        |                                            |
        |   cũ: <TypographyH1>, text-*, font-*  ---- |--> co dần về 0
        |   mới: <h1 className="type-headline"> ---- |--> lớn dần
        |                                            |
        |   hai cách sống chung, không đè nhau       |
        +--------------------------------------------+
```

- **Seam theo trang/luồng** (lát dọc), không theo loại component: heading của một trang nằm rải trong page và vài component riêng, chuyển nửa vời sẽ sai thứ tự heading và lệch cỡ chữ trong cùng trang. Component dùng chung (`ProductCard`, header, footer) thuộc lát đầu tiên dùng nó.
- **Không wrapper tương thích**: không đổi `TypographyH1` thành lớp vỏ của `type-*` (đổi cả site cùng lúc là big-bang trá hình). `type-*` là CSS thuần nên cũ và mới sống chung được.
- **Ratchet (cơ chế ép)**: `scripts/typography-migrated.txt` liệt kê file/glob đã chuyển. `python3 scripts/typography-audit.py --check` thoát mã 1 nếu file trong danh sách quay lại dùng `Typography*`, `text-<size>`, `font-<weight>`, `leading-*`, `tracking-*`. Danh sách chỉ thêm, không bớt. Đã thử: thêm một file chưa chuyển vào danh sách thì `--check` báo REGRESSION và exit 1.
- **Quy tắc cho code mới**: file mới chỉ dùng `type-*` (thêm vào `CLAUDE.md` khi lát 1 bắt đầu).

## Lát 0: nền (XONG, kiểm chứng bằng build, chưa commit, không đổi giao diện)

| Việc | Kết quả kiểm |
|---|---|
| Thêm 4 role vào `elc-v2/app/globals.css` | 16 `@utility type-*` |
| Chép khối type scale sang `elc-temp/app/globals.css` | Tailwind v4 biên dịch đủ 16 role (kiểm bằng `@source inline` + postcss, không thiếu cái nào); trạng thái 4 role mới đúng số đo |
| `cn()` dùng `extendTailwindMerge`, export `TYPE_ROLES` (`shared/lib/utils.ts`) | `shared/lib/__tests__/cn-type-roles.test.ts` 7 test pass: type-* thắng size/weight/leading/tracking đứng trước và ngược lại; màu và margin không bị ảnh hưởng; test bắt `TYPE_ROLES` lệch với `@utility` trong css |
| `scripts/typography-audit.py --check` + `typography-migrated.txt` | thử REGRESSION đúng, danh sách hiện rỗng |
| Số liệu baseline không đổi | `type_utility` = 0, các cột khác y nguyên (chưa chỗ nào dùng) |

**Kiểm chứng build (2026-10-29, đã chạy):** build A (2 file lát 0 về bản `HEAD`) và build B (có lát 0), `next start` cả hai với Go API local thật (196 sản phẩm), lấy `/`, `/san-pham` và một URL 404 (render `not-found.tsx`):

| Trang | DOM (HTML ngoài script flight) | Flight data (RSC) |
|---|---|---|
| `/` | giống hệt | 93 record giống hệt |
| `/san-pham` | giống hệt | 78 record giống hệt |
| 404 (`not-found.tsx`) | giống hệt | 56 record giống hệt |

Giống hệt sau khi loại 3 thứ nhiễu có sẵn (đã chứng minh bằng cách so cùng một build hai lần): hash tên chunk JS/CSS, build id, và `createdAt/updatedAt` do API local tự sinh mỗi request. CSS: B chỉ **thêm** đúng 16 selector `type-*` (27 rule kể cả media query), không mất rule nào của A (CSS A 268110 byte, B 270220 byte).

Kết luận: lát 0 không đổi giao diện. Lần so sau (mỗi lát) dùng đúng cách này, bỏ nhiễu như trên.

Lưu ý khi chạy lại: thứ tự các record flight trong HTML thay đổi giữa hai request (streaming), nên không so được bằng `diff` thô; so DOM tách riêng và flight theo tập hợp.

## Lát 1: `app/not-found.tsx` (XONG local 2026-10-29, chờ người dùng duyệt bằng mắt, chưa commit)

Phần còn lại của lát 1 trong bảng dưới (`(public)/error.tsx`, `magic-link`) chưa làm.

| Chỗ | Cũ | Mới |
|---|---|---|
| số "404" | `<h1>` `text-8xl md:text-9xl font-extrabold tracking-tighter leading-none` | `<p aria-hidden="true">` `type-display` (128px thành 56px; màu/`select-none`/`animate-pulse` giữ) |
| tiêu đề | `TypographyH1` + `text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight` | `<h1 className="type-headline">` (28/40, w600) |
| mô tả | `TypographyLead` + `text-sm md:text-base` | `<p className="type-body ...">` (16/17) |
| nút | `font-semibold` đè lên `Button` | `type-label` (14/600, cỡ và weight y như cũ; `cn()` hai chiều thay `text-sm font-medium` của nút) |

Số đo: `typography_component` 107 thành 105, `text_size_util` 250 thành 243, `font_weight_util` 135 thành 132, `leading_tracking_util` 75 thành 72, `type_utility` 0 thành 4. File đã thêm vào `typography-migrated.txt`, `--check` exit 0. Đã sửa script đếm `type-*` cho đủ 16 role.

Cấu trúc: trước đây trang có **hai `<h1>`** ("404" và tiêu đề); giờ còn một (`h1` = "Trang không tồn tại").

Kiểm chứng build (build C vs build B, cùng cách của lát 0): DOM của `/`, `/san-pham`, 404 không đổi; JSON-LD trang chủ và san-pham giống hệt; khác biệt flight data chỉ nằm ở cây `not-found` (class đổi, `h1` thành `p`) và việc đánh số tham chiếu (`$L..`, record id) khi danh sách module dịch chuyển.

Phát hiện phụ (không thuộc lát này): với URL lạ, HTML trả về **không có nội dung ở DOM** (body chỉ có `<div hidden>`), tiêu đề 404 chỉ nằm trong flight data nên cần JS để hiện. Không ảnh hưởng SEO (404 không được index) nhưng cần nhớ khi so snapshot heading của trang 404: phải đọc flight data chứ không đọc DOM.

## Thứ tự lát

Số liệu của từng zone: `python3 scripts/typography-audit.py --files <zone>`.

**Public (đổi trước, ảnh hưởng SEO và khách):**

| Lát | Nội dung |
|---|---|
| 1 | `app/not-found.tsx`, `(public)/error.tsx`, `magic-link` (nhỏ, thử quy trình) |
| 2 | `/thong-tin` (hub + `[slug]`), `/[slug]` (trang tĩnh) |
| 3 | `/tin-tuc` (list + `[slug]`; có 8 `Typography*`, có `.typeset` nên kiểm chỗ giáp ranh) |
| 4 | `/du-an` + `ProjectCard`, `ProjectFilters` |
| 5 | `/dich-vu` + `ServiceDetailModule`, `CardService` |
| 6 | `/san-pham` list + `ProductCard`, `FormattedPrice`, filters |
| 7 | `/san-pham/[slug]` (`ProductDetailModule`, variant switcher, floating bar) |
| 8 | luồng inquiry/`/form` (`LeadFormScreen`, `steps/*`) |
| 9 | header, mega-menu, footer, consent banner (dùng toàn site, đổi sau khi các trang đã ổn) |
| 10 | trang chủ (`hero`, `cta`, sections) |

**Admin (137 file, 449 `text-*`), chia theo module, mỗi module một lát:** 11a dashboard/metrics, 11b catalog (form lớn nhất), 11c project/service/news/page/faq, 11d phần còn lại (brand, category, group, tag, branch, contact...). Admin dày chữ 14px/12px nên chủ yếu dùng `type-body-sm`, `type-caption`, `type-label`, `type-tag`, `type-legal`; role mới ở trên sinh ra chính vì thế.

**12:** `shared/components/ui/*` (shadcn: button, input, badge, table...). Làm sau cùng của phần chữ vì mọi lát trên đều dùng chúng, đổi sớm thì đụng mọi trang.

**13: dọn và font**
1. Khi `typography_component` = 0: xóa `shared/components/ui/typography.tsx`.
2. Gỡ Inter tự host (`app/fonts/InterVariable*.woff2`, `localFont` trong `app/layout.tsx`), dùng `Inter` từ `next/font/google` giống elc-v2. Xem lại `font-[590]` (hiện chỉ tồn tại vì Inter tự host); `type-*` dùng 400/500/600. Kiểm tra Merriweather, JetBrains Mono, Geist Mono còn ai dùng không (elc-v2 chỉ có Inter + Geist Mono) và gỡ cái thừa.
3. Cập nhật `docs/design-system.md`, đóng Status của tài liệu này và `typography-migration-plan.md`.

## Thước đo giao diện (`scripts/typography-metrics.mjs`, XONG 2026-10-29)

Diff DOM/flight chỉ chứng minh cấu trúc không vỡ, không chứng minh chữ to nhỏ thế nào. Script này đo cái mắt thấy:

```
node scripts/typography-metrics.mjs snap --base http://localhost:3204 --out docs/typography-snapshots/after-lat-N.json
node scripts/typography-metrics.mjs diff docs/typography-snapshots/baseline-2026-10-29.json docs/typography-snapshots/after-lat-N.json [--page /san-pham] [--strict]
```

- `snap`: với mỗi trang trong `scripts/typography-pages.json` x viewport 375/768/1280 (hai viewport sau bắt đúng breakpoint `md`/`lg`), ghi computed font-size, weight, line-height, letter-spacing, chiều cao của mọi phần tử có chữ, dàn ý heading (tag + text) và chiều cao cả trang. Dùng Playwright, tốn khoảng 80 giây cho 16 trang.
- `diff`: ghép phần tử theo tag + text, gom thay đổi thành dòng kiểu `14px/400/20px -> 14px/400/21px: 12 elements`, báo đổi dàn ý heading (số `h1` trước/sau) và lệch chiều cao trang. `--strict` thoát mã 1 nếu có gì lệch.
- Lõi so sánh `scripts/typography-metrics-core.mjs` có 6 test (`scripts/__tests__/`).
- **Đã kiểm độ ổn định**: hai lần chụp liên tiếp cùng một build cho 48/48 trang x viewport giống hệt, nên mọi lệch về sau là lệch thật, không phải nhiễu.
- Baseline `docs/typography-snapshots/baseline-2026-10-29.json` (2.2 MB) chụp từ build có `not-found.tsx` đã chuyển (lát 1) và mọi trang khác chưa chuyển; trang 404 trong baseline vì thế đã là bản mới. Chụp bằng `next start` (production) trên build local với API local, không dùng dev server.
- Trang chi tiết sản phẩm/dự án/tin tức chưa có trong danh sách (phụ thuộc slug trong DB); lát nào chuyển chúng thì thêm vào `typography-pages.json` và chụp lại baseline **trước khi sửa** lát đó.
- Cách dùng mỗi lát: chụp snapshot sau khi chuyển, `diff` với baseline, đọc các dòng chuyển đổi (chúng phải khớp với bảng ánh xạ, vd `text-sm` chuyển sang `type-body-sm` cho ra đúng `14px/400/20px -> 14px/400/21px`), rồi bạn mới nhìn bằng mắt.

## Định nghĩa "xong" cho mỗi lát (đo được)

1. **Số đo**: các file của lát có `typography_component`, `text_size_util`, `font_weight_util`, `leading_tracking_util` = 0 (chỗ ngoại lệ phải ghi lý do); thêm chúng vào `typography-migrated.txt`; `--check` exit 0; `type_utility` tăng tương ứng.
2. **Cấu trúc**: mỗi trang đúng một `h1`, text `h1` y nguyên production, heading không nhảy cấp. So danh sách `h1-h6` của HTML production (chụp **trước** khi bắt đầu lát, lưu `docs/typography-snapshots/`) với bản mới.
3. **Build**: `bunx tsc --noEmit`, `bun run lint` trên file đã sửa, `vitest run` (3 test validator catalog đã fail sẵn từ trước, không tính), `bun run build`.
4. **Giao diện**: `typography-metrics.mjs diff` với baseline; mọi dòng chuyển đổi phải giải thích được bằng bảng ánh xạ; chiều cao trang lệch nhiều hơn dự kiến thì dừng. Sau đó người dùng nhìn trang trên mobile và desktop.
5. **CLS/LCP**: không tệ đi, đo PageSpeed trước và sau trên trang đại diện.
6. **Commit** chỉ khi người dùng xác nhận, một lát một commit.

## Rủi ro và cách chặn

| Rủi ro | Chặn bằng |
|---|---|
| Mất margin của `Typography*` làm lệch bố cục | ánh xạ ghi margin đi đâu; duyệt bằng mắt mỗi lát |
| `type-*` bị `text-*` đè trên cùng phần tử | `cn()` hai chiều + test; ratchet `--check` |
| Thêm `@utility type-*` mà quên `TYPE_ROLES` | test so khớp `TYPE_ROLES` với `globals.css` |
| Đổi cỡ làm đổi ngắt dòng, CLS | đo CLS trước/sau |
| Mất `h1` vô ý | so snapshot heading |
| Bỏ sót chỗ nào đó | ratchet chặn quay lại; số đo toàn project phải về 0 mới đóng |
| Dừng giữa chừng | seam theo trang, mọi điểm dừng đều deploy được |
| Admin dày chữ lệch 1 đến 2px | chấp nhận (quyết định 6); `typography-metrics` đo mức lệch thật |

## Việc mở

1. Duyệt bảng ánh xạ, nhất là `TypographyLarge` (7 chỗ), `TypographyLead` (3 chỗ) và `text-3xl+` (8 chỗ).
2. Duyệt `not-found.tsx` bằng mắt (số "404" nhỏ đi từ 128px xuống 56px là thay đổi lớn nhất), rồi làm nốt `error.tsx` và `magic-link` hoặc sang lát 2.

## Kết quả cuối (2026-10-29)

Số đo cuối (`python3 scripts/typography-audit.py`): `Typography*` = **0** ở mọi vùng; `text-<size>` rời còn **2 chỗ**, cả hai ở `seo-snippet-preview.tsx` (bản mô phỏng kết quả Google nên cố ý giữ cỡ chữ của Google); script đo giờ bắt cả cỡ tùy ý như `text-[1.75rem]`; `type-*` đang dùng 872 chỗ. `font-<weight>` rời còn 101 và `leading/tracking` rời còn 28: đó là nhấn mạnh trong dòng (`font-medium` trên một `span` không có cỡ riêng), không có role nào để ánh xạ, nên giữ.

| Phần | Cách làm |
|---|---|
| public (lát 1 đến 10) | làm tay từng lát: kiểu chữ + cấu trúc thẻ + a11y cùng lúc |
| auth | làm tay (`LoginForm`, `VerifyCodeForm`, `auth-layout`) |
| admin | `scripts/typography-codemod.py --zone admin`: 430 chuỗi class tự chuyển; 8 chuỗi template/ngoại lệ chuyển tay |
| `shared/ui` | cùng codemod: 101 chuỗi tự chuyển; 11 chuỗi có biến thể (`md:text-sm`, `group-data-[...]:text-xs`) chuyển tay thành `md:type-body-sm`... |
| `typography.tsx` | đã xóa (`git rm`); 0 file import |
| font | `app/layout.tsx` dùng `Inter` (`latin` + `vietnamese`, `axes: ["opsz"]`) và `Geist_Mono` (`latin` + `latin-ext`, vì kiểu của font này không có `vietnamese`) qua `next/font/google`, như elc-v2. Đã bỏ `app/fonts/` (Inter tự host chép từ Linear), Merriweather và JetBrains Mono. Đã kiểm trên trình duyệt: `h1` là Inter 56px/600, 3 mặt Inter tải về gồm khối Vietnamese |
| ratchet | `python3 scripts/typography-audit.py --check` (cấu hình `scripts/typography-migrated.txt`): thoát mã 1 nếu bất kỳ file nào trong `app/`, `modules/`, `shared/` dùng `Typography*` hoặc `text-<size>` rời, trừ 1 miễn trừ có ghi lý do (`seo-snippet-preview.tsx`) |

Kiểm chứng: `tsc` sạch, `next build` thành công (exit 0, chạy trên bản sao), `vitest` chỉ còn 3 test lỗi có từ trước (`modules/catalog/__tests__/domain/validators.test.ts`), `eslint` không phát sinh lỗi mới.

Chấp nhận có chủ ý (đã nói với người dùng): thang elc-v2 lấy số đo Apple nên chữ nhỏ cao hơn Tailwind 1 đến 2px (`type-legal` 18px so với `text-xs` 16px); một số chữ đổi đậm/nhạt khi weight 500 gộp về 400 hoặc 600; admin sẽ dựng lại sau.

`header/` (menu apple-style của người dùng, Base UI `NavigationMenu` + `Dialog`): cỡ chữ đo từ apple.com chuyển sang cùng thang (`type-legal`, `type-tag`, `type-title`, `type-headline`, `type-callout`, `type-body-strong`); a11y: `navigation "Menu chính"` cho cả desktop lẫn sheet mobile, mỗi cột submenu có nhãn (`aria-labelledby`), nút "Quay lại"/"Đóng menu" bằng tiếng Việt, icon trang trí `aria-hidden`. Kiểm bằng trình duyệt: `aria-expanded` đổi khi bấm, sheet mobile vào nhóm thì danh sách mang tên nhóm. Mọi trang chính: đúng 1 `h1`, không nhảy cấp, đúng 1 `main`.

Việc còn lại (không thuộc kế hoạch này): chưa có skip link "Bỏ qua tới nội dung chính" (cần `id` ở `<main>` của từng trang, vì mỗi trang tự render `main`); `font-<weight>` rời (101 chỗ) là nhấn mạnh trong dòng nên giữ.

## Kiểm chứng a11y bằng axe-core (2026-10-29)

`node scripts/a11y-axe.mjs --base http://localhost:3304 [--strict]` (bản production, 21 trang x desktop/mobile = 42 lượt). Lần đầu tìm ra 8 loại vi phạm mà kiểm tay bỏ sót; đã sửa 7, còn lại duy nhất `color-contrast` (màu chữ, nằm ngoài phạm vi):

| Luật axe | Nguyên nhân | Sửa |
|---|---|---|
| `button-name` (critical) | `role="combobox"` không lấy tên từ chữ bên trong; `LocationPickerDialog` (tự mở ở `/san-pham*`) và `BranchManagement` thiếu `label` | truyền `label` cho `LocationCombobox` |
| `aria-allowed-attr` (critical) | Base UI gắn `aria-orientation` lên thẻ `ul` của menu | gỡ ở lớp bọc `NavigationMenuList` |
| `label-content-name-mismatch` + `image-redundant-alt` | thẻ dự án: `aria-label` lệch chữ hiển thị (có thêm thẻ "Nổi bật"), `alt` ảnh trùng tên | bỏ `aria-label`, `alt=""` |
| `frame-title` | iframe Google Maps không có `title` | `title="Bản đồ <tên chi nhánh>"` |
| `scrollable-region-focusable` | bảng trong nội dung bài cuộn ngang nhưng không focus được bằng bàn phím | `tabindex="0" role="region" aria-label` cho `.table-wrapper` |
| `meta-viewport` | `maximum-scale=1` chặn zoom (WCAG 1.4.4) | bỏ `maximumScale` ở `app/layout.tsx` (ô nhập công khai đã >= 16px nên iOS không tự phóng) |
| `color-contrast` (45 nút, 18 trang) | màu chữ (ví dụ đoạn mô tả `.typeset`) | chưa sửa: màu không thuộc phạm vi |

Chưa được axe hay tôi kiểm: admin (cần đăng nhập, chưa rà cấu trúc/a11y; chỉ mới chuyển kiểu chữ), trạng thái sau khi tương tác (dropdown, dialog mở), thử bằng trình đọc màn hình thật, thứ tự Tab và trả focus bằng tay, skip link.
