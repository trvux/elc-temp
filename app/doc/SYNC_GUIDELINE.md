# HUONG DAN DONG BO HOA VA QUY TAC THIET KE UI

Tai lieu nay quy dinh cac tieu chuan de dong bo hoa giao dien, dam bao tinh nhat quan (consistency) va de dang bao tri cho toan bo he thong.

## 1. QUY TAC TOI THUONG

- TUYET DOI KHONG chinh sua truc tiep cac file trong thu muc `components/ui/`.
- Neu can custom, hay su dung Tailwind classes thong qua props `className` hoac tao mot component wrapper ben ngoai.

## 2. CHUYEN DOI THE HTML SANG SHADCN COMPONENT

Tat ca cac the HTML co ban phai duoc thay the bang Shadcn component tuong ung da duoc cai dat.

- `button` -> `Button` (import { Button } from "@/components/ui/button")
- `input` -> `Input` (import { Input } from "@/components/ui/input")
- `a` -> `Link` (import Link from "next/link") - ket hop cung `buttonVariants` neu can giao dien nut.
- `checkbox` -> `Checkbox`
- `dialog`, `modal` -> `Dialog`
- `select` -> `Select`

## 3. CHUAN HOA TYPOGRAPHY (FONT SIZE, TRACKING, LEADING)

Typography se duoc dinh nghia tap trung tai `app/globals.css` trong `@layer base` de dam bao tat ca cac the tieu de deu giong nhau ma khong can declare class nhieu lan.

Quy tac ap dung:

- h1: text-4xl (hoac 5xl), font-bold, tracking-tight, leading-none
- h2: text-3xl, font-semibold, tracking-tight, leading-snug
- h3: text-2xl, font-semibold, tracking-tight
- p: text-base, leading-relaxed, text-muted-foreground (cho noi dung phu)
- span: Su dung linh hoat nhung phai tuan thu Tailwind tokens (xs, sm, md, lg, xl).
- **Luu y quan trong**:
    - **TUYET DOI KHONG** su dung cac gia tri tu do (arbitrary values) nhu `leading-[1.65]` hoac `tracking-[0.3em]`. 
    - Tat ca Typography phai tuan thu Tailwind tokens:
        - Leading: `none`, `tight`, `snug`, `normal`, `relaxed`, `loose`.
        - Tracking: `tighter`, `tight`, `normal`, `wide`, `wider`, `widest`.
    - Cac thiet lap trong `globals.css` (@layer base) la **quy chuan bat buoc**. Tranh viec declare lai neu the HTML da co style san.
    - Toan bo cac class `text-fluid-` da bi loai bo khoi `globals.css` vi khong phu hop. Tuyet doi khong tiep tuc su dung. Neu gap cac class nay trong code cu (orphan classes), hay thay the chung bang Tailwind tokens tuong ung.

## 4. QUAN LY MAU SAC (LIGHT/DARK MODE)

Khong su dung ma mau hex (vi du: #ffffff) hoac rgb truc tiep trong code. Bat buoc su dung CSS variables/Tailwind tokens da duoc cau hinh trong `globals.css`.

- Mau nen: `bg-background`
- Mau chu chinh: `text-foreground`
- Mau chu phu: `text-muted-foreground`
- Mau nhan manh: `text-primary` hoac `bg-primary`
- Duong vien: `border-border`

## 5. QUY TAC KHOANG CACH VA GIA TRI TU DO (SPACING & ARBITRARY VALUES)

Su dung nghiem ngat he thong token cua Tailwind (boi so cua 4). Tuyet DOI KHONG dung gia tri tu do nhu `p-[13px]` hoac `leading-[1.7]`.

- Padding/Margin nho: `p-1` (4px), `p-2` (8px), `p-3` (12px), `p-4` (16px).
- Khoang cach giua cac section: Su dung thong nhat mot muc (vi du: `py-16` hoac `py-20`).
- Container: Su dung class `layout-container` da dinh nghia trong `globals.css` de can giua noi dung.

## 6. KIEM TRA VA SCAN

Truoc khi hoan thanh bat ky tinh nang nao, hay scan lai file de dam bao:

1. Da dung component Shadcn chua?
2. Co dung ma mau hex nao khong?
3. Font size da dung token Tailwind chua?
4. Khoang cach co bi le khoi he thong 4px khong?
