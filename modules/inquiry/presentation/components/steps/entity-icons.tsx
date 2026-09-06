import { useId, type ReactNode } from "react";

// Placeholder illustrations for the lead form's catalog pickers — admin
// hasn't populated `imageUrl`/`image` for most category/group/type rows, so
// showing the real photo field meant most cards rendered empty. Each item
// gets its own hand-drawn gradient badge + accurate glyph instead (matched
// by slug substring, same pattern as `deriveSupportType` in
// LeadFormScreen). This is a stopgap: intended to be swapped for real
// AI-generated illustrations (see project chat) once those are ready —
// swap happens per icon in the lookup tables below, nothing else in the
// call sites needs to change.
type IllustrationProps = { className?: string };
type Illustration = (props: IllustrationProps) => React.JSX.Element;

interface BadgeProps {
  from: string;
  to: string;
  shadow: string;
  className?: string;
  children: ReactNode;
}

// Shared "app icon" shell: rounded gradient square, soft top specular
// highlight, subtle drop shadow tinted to the gradient — the glyph (always
// white) is passed as children. useId keeps the gradient/filter ids
// collision-safe even though every card on a grid mounts one of these.
function Badge({ from, to, shadow, className, children }: BadgeProps) {
  const uid = useId();
  const gradId = `${uid}-grad`;
  const hlId = `${uid}-hl`;
  const shId = `${uid}-sh`;
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <linearGradient id={hlId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={shId} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.2" floodColor={shadow} floodOpacity="0.28" />
        </filter>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="16" fill={`url(#${gradId})`} filter={`url(#${shId})`} />
      <rect x="3" y="3" width="58" height="26" rx="16" fill={`url(#${hlId})`} />
      {children}
    </svg>
  );
}

const STROKE = "#fff";

// ---------------------------------------------------------------------
// Product / service categories (12) — dòng máy
// ---------------------------------------------------------------------

function IconTreoTuong({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#5AA9F2" to="#2E6FE0" shadow="#2E6FE0">
      <rect x="17" y="25" width="30" height="9.5" rx="3.2" stroke={STROKE} strokeWidth="1.7" />
      <circle cx="41" cy="29.7" r="1.15" fill={STROKE} />
      <path d="M22 38.5 L18.5 45" stroke={STROKE} strokeWidth="1.7" strokeLinecap="round" opacity="0.9" />
      <path d="M28.3 38.5 L26.3 46.6" stroke={STROKE} strokeWidth="1.7" strokeLinecap="round" opacity="0.55" />
      <path d="M34.6 38.5 L33.5 48" stroke={STROKE} strokeWidth="1.7" strokeLinecap="round" opacity="0.3" />
    </Badge>
  );
}

function IconAmTran({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#22D3EE" to="#0E7C93" shadow="#0E7C93">
      <rect x="19" y="19" width="26" height="26" rx="4" stroke={STROKE} strokeWidth="1.7" />
      <circle cx="32" cy="32" r="6" stroke={STROKE} strokeWidth="1.6" />
      <path d="M32 15 v6 M32 43 v6 M15 32 h6 M43 32 h6" stroke={STROKE} strokeWidth="1.9" strokeLinecap="round" opacity="0.85" />
    </Badge>
  );
}

function IconGiauTran({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#34D0B6" to="#0D8F79" shadow="#0D8F79">
      <rect x="13" y="26" width="19" height="11" rx="2.5" stroke={STROKE} strokeWidth="1.7" />
      <path
        d="M32 31.5 h5 M39 28 q2 0 2 3.5 t-2 3.5 M43 28 q2 0 2 3.5 t-2 3.5 M47 28 q2 0 2 3.5 t-2 3.5"
        stroke={STROKE}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </Badge>
  );
}

function IconTuDung({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#6C8CF5" to="#3B4FCB" shadow="#3B4FCB">
      <rect x="24" y="12" width="16" height="40" rx="3" stroke={STROKE} strokeWidth="1.7" />
      <line x1="27" y1="19" x2="37" y2="19" stroke={STROKE} strokeWidth="1.3" opacity="0.6" />
      <line x1="27" y1="23" x2="37" y2="23" stroke={STROKE} strokeWidth="1.3" opacity="0.6" />
      <line x1="27" y1="27" x2="37" y2="27" stroke={STROKE} strokeWidth="1.3" opacity="0.6" />
      <rect x="27" y="34" width="10" height="6" rx="1.2" stroke={STROKE} strokeWidth="1.3" opacity="0.85" />
    </Badge>
  );
}

function IconApTran({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#7DD3FC" to="#0EA5E9" shadow="#0EA5E9">
      <line x1="12" y1="16" x2="52" y2="16" stroke={STROKE} strokeWidth="1.6" opacity="0.5" />
      <rect x="16" y="16" width="32" height="9" rx="2.5" stroke={STROKE} strokeWidth="1.7" />
      <path d="M22 29 L19 36 M32 29 L30.5 38 M42 29 L39.5 36" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </Badge>
  );
}

function IconKhiTuoi({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#4ADE80" to="#16A34A" shadow="#16A34A">
      <rect x="20" y="20" width="24" height="18" rx="3" stroke={STROKE} strokeWidth="1.7" />
      <path d="M24 26 h9 M33 26 l-3 -3 M33 26 l-3 3" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M40 32 h-9 M31 32 l3 -3 M31 32 l3 3" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Badge>
  );
}

function IconPhuKien({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#94A3B8" to="#475569" shadow="#475569">
      <path d="M14 40 q4 -12 12 -12 q4 0 4 4" stroke={STROKE} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="32" r="1.4" fill={STROKE} />
      <rect x="32" y="27" width="10" height="10" rx="2.5" stroke={STROKE} strokeWidth="1.6" />
      <path d="M42 32 h6" stroke={STROKE} strokeWidth="1.7" strokeLinecap="round" />
    </Badge>
  );
}

function IconLocNuoc({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#3FCB9B" to="#0FA36B" shadow="#0FA36B">
      <rect x="23" y="12" width="15" height="22" rx="3" stroke={STROKE} strokeWidth="1.7" />
      <path d="M38 21 h6.5 v6 h-6.5" stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <line x1="30.5" y1="34" x2="30.5" y2="39" stroke={STROKE} strokeWidth="1.7" />
      <path d="M30.5 39 C30.5 39 25.5 45 25.5 48.6 a5 5 0 0 0 10 0 C35.5 45 30.5 39 30.5 39Z" fill={STROKE} />
    </Badge>
  );
}

function IconBangDieuKhien({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#A78BFA" to="#7C3AED" shadow="#7C3AED">
      <rect x="18" y="14" width="28" height="36" rx="3" stroke={STROKE} strokeWidth="1.7" />
      <circle cx="32" cy="26" r="5.5" stroke={STROKE} strokeWidth="1.6" />
      <line x1="32" y1="26" x2="32" y2="22" stroke={STROKE} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="25" cy="40" r="1.4" fill={STROKE} />
      <circle cx="32" cy="40" r="1.4" fill={STROKE} />
      <circle cx="39" cy="40" r="1.4" fill={STROKE} />
    </Badge>
  );
}

function IconCongTac({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#C084FC" to="#9333EA" shadow="#9333EA">
      <rect x="21" y="12" width="22" height="34" rx="3" stroke={STROKE} strokeWidth="1.7" />
      <rect x="27" y="20" width="10" height="16" rx="5" stroke={STROKE} strokeWidth="1.6" />
      <circle cx="32" cy="25" r="1.6" fill={STROKE} />
    </Badge>
  );
}

function IconCamBien({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#FBBF24" to="#D97706" shadow="#D97706">
      <circle cx="32" cy="36" r="4" fill={STROKE} />
      <path d="M24 30 a12 12 0 0 1 16 0" stroke={STROKE} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M19 25 a19 19 0 0 1 26 0" stroke={STROKE} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.5" />
    </Badge>
  );
}

function IconRemote({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#64748B" to="#334155" shadow="#334155">
      <rect x="25" y="9" width="14" height="46" rx="6" stroke={STROKE} strokeWidth="1.7" />
      <circle cx="32" cy="16" r="2.4" fill={STROKE} />
      <rect x="28.5" y="23" width="7" height="4" rx="1.2" fill={STROKE} opacity="0.5" />
      <rect x="28.5" y="30" width="7" height="4" rx="1.2" fill={STROKE} opacity="0.5" />
      <rect x="28.5" y="37" width="7" height="4" rx="1.2" fill={STROKE} opacity="0.5" />
      <rect x="28.5" y="44" width="7" height="4" rx="1.2" fill={STROKE} opacity="0.5" />
      <path d="M20 13 a13 13 0 0 0 -4 8" stroke={STROKE} strokeWidth="1.7" strokeLinecap="round" opacity="0.8" fill="none" />
      <path d="M15 8 a19 19 0 0 0 -6 12" stroke={STROKE} strokeWidth="1.7" strokeLinecap="round" opacity="0.5" fill="none" />
    </Badge>
  );
}

export function getCategoryIcon(slug?: string): Illustration {
  const s = slug ?? "";
  if (s.includes("treo-tuong")) return IconTreoTuong;
  if (s.includes("am-tran")) return IconAmTran;
  if (s.includes("giau-tran")) return IconGiauTran;
  if (s.includes("tu-dung")) return IconTuDung;
  if (s.includes("ap-tran")) return IconApTran;
  if (s.includes("khi-tuoi") || s.includes("thu-hoi-nhiet")) return IconKhiTuoi;
  if (s.includes("phu-kien")) return IconPhuKien;
  if (s.includes("loc-nuoc")) return IconLocNuoc;
  if (s.includes("bang-dieu-khien")) return IconBangDieuKhien;
  if (s.includes("cong-tac")) return IconCongTac;
  if (s.includes("cam-bien")) return IconCamBien;
  if (s.includes("remote")) return IconRemote;
  return IconTreoTuong;
}

// ---------------------------------------------------------------------
// Service groups (6)
// ---------------------------------------------------------------------

function IconCungCapLapDat({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#FB923C" to="#EA580C" shadow="#EA580C">
      <rect x="13" y="27" width="24" height="18" rx="1.5" stroke={STROKE} strokeWidth="1.7" />
      <line x1="13" y1="32.5" x2="37" y2="32.5" stroke={STROKE} strokeWidth="1.4" />
      <path d="M46 15 l-3.5 3.5 a3.2 3.2 0 1 0 4.5 4.5 L50.5 19.5" stroke={STROKE} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="42.5" y1="22.5" x2="35" y2="30" stroke={STROKE} strokeWidth="1.9" strokeLinecap="round" />
    </Badge>
  );
}

function IconVeSinhBaoTri({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#22D3EE" to="#0891B2" shadow="#0891B2">
      <rect x="26" y="24" width="10" height="18" rx="2.5" stroke={STROKE} strokeWidth="1.7" />
      <rect x="29" y="18" width="4" height="6" stroke={STROKE} strokeWidth="1.5" />
      <path d="M33 19 h6" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="41" cy="16" r="1" fill={STROKE} opacity="0.8" />
      <circle cx="44" cy="19" r="1" fill={STROKE} opacity="0.55" />
      <circle cx="41" cy="22" r="1" fill={STROKE} opacity="0.35" />
    </Badge>
  );
}

function IconThuCuDoiMoi({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#FCD34D" to="#D97706" shadow="#D97706">
      <path d="M22 26 a10 10 0 0 1 17 -4" stroke={STROKE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M39 22 l4 -1 l-1 4" stroke={STROKE} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 38 a10 10 0 0 1 -17 4" stroke={STROKE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M25 42 l-4 1 l1 -4" stroke={STROKE} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Badge>
  );
}

function IconThanhLy({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#FB7185" to="#E11D48" shadow="#E11D48">
      <path d="M17 22 h16 l13 13 -13 13 -16 0 Z" stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" fill="none" />
      <circle cx="23" cy="28" r="2" stroke={STROKE} strokeWidth="1.4" />
    </Badge>
  );
}

function IconChoThue({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#818CF8" to="#4F46E5" shadow="#4F46E5">
      <rect x="15" y="16" width="26" height="24" rx="3" stroke={STROKE} strokeWidth="1.7" />
      <line x1="15" y1="23" x2="41" y2="23" stroke={STROKE} strokeWidth="1.4" opacity="0.6" />
      <line x1="21" y1="13" x2="21" y2="19" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="35" y1="13" x2="35" y2="19" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="28" cy="32" r="6" stroke={STROKE} strokeWidth="1.4" />
      <path d="M28 28.5 v3.5 l2.5 2" stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </Badge>
  );
}

function IconKhac({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#A3A3A3" to="#525252" shadow="#525252">
      <circle cx="23" cy="32" r="3" fill={STROKE} />
      <circle cx="32" cy="32" r="3" fill={STROKE} />
      <circle cx="41" cy="32" r="3" fill={STROKE} />
    </Badge>
  );
}

export function getServiceGroupIcon(slug?: string): Illustration {
  const s = slug ?? "";
  if (s.includes("cung-cap") || s.includes("lap-dat")) return IconCungCapLapDat;
  if (s.includes("bao-tri") || s.includes("bao-duong") || s.includes("ve-sinh")) return IconVeSinhBaoTri;
  if (s.includes("thu-cu")) return IconThuCuDoiMoi;
  if (s.includes("thanh-ly")) return IconThanhLy;
  if (s.includes("cho-thue")) return IconChoThue;
  return IconKhac;
}

// ---------------------------------------------------------------------
// Project types (13) — loại công trình
// ---------------------------------------------------------------------

function IconCanHoDichVu({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#A78BFA" to="#6D28D9" shadow="#6D28D9">
      <rect x="14" y="14" width="20" height="34" rx="2.5" stroke={STROKE} strokeWidth="1.6" />
      <circle cx="20" cy="21" r="1.3" fill={STROKE} opacity="0.7" />
      <circle cx="28" cy="21" r="1.3" fill={STROKE} opacity="0.4" />
      <circle cx="20" cy="28" r="1.3" fill={STROKE} opacity="0.4" />
      <circle cx="28" cy="28" r="1.3" fill={STROKE} opacity="0.4" />
      <circle cx="43" cy="38" r="4" stroke={STROKE} strokeWidth="1.6" />
      <path d="M46.8 40.8 L50 44 M48 42.5 L50.5 40" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" />
    </Badge>
  );
}

function IconCoSoGiaoDuc({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#60A5FA" to="#2563EB" shadow="#2563EB">
      <path d="M32 18 L52 26 L32 34 L12 26 Z" stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M22 29.5 v8 q10 6 20 0 v-8" stroke={STROKE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="46" y1="27.5" x2="46" y2="38" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" />
    </Badge>
  );
}

function IconCoSoKinhDoanh({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#FDBA74" to="#EA580C" shadow="#EA580C">
      <path d="M14 26 l3 -10 h30 l3 10" stroke={STROKE} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <path
        d="M14 26 v3 a5 5 0 0 0 10 0 v-3 M24 26 v3 a5 5 0 0 0 10 0 v-3 M34 26 v3 a5 5 0 0 0 10 0 v-3"
        stroke={STROKE}
        strokeWidth="1.4"
        fill="none"
      />
      <rect x="18" y="34" width="28" height="16" stroke={STROKE} strokeWidth="1.6" />
      <rect x="28" y="40" width="8" height="10" stroke={STROKE} strokeWidth="1.4" />
    </Badge>
  );
}

function IconCongTrinhCongNghiep({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#94A3B8" to="#334155" shadow="#334155">
      <path d="M14 46 v-14 l10 6 v-6 l10 6 v-6 l10 6 v14 Z" stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" fill="none" />
      <rect x="40" y="18" width="6" height="10" stroke={STROKE} strokeWidth="1.5" />
      <path d="M42 18 q2 -4 0 -7" stroke={STROKE} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" fill="none" />
    </Badge>
  );
}

function IconShowroom({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#F9A8D4" to="#DB2777" shadow="#DB2777">
      <rect x="15" y="16" width="34" height="26" rx="2.5" stroke={STROKE} strokeWidth="1.6" />
      <path d="M24 34 v-6 a4 4 0 0 1 8 0 v6" stroke={STROKE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="22" y="34" width="12" height="4" rx="1" stroke={STROKE} strokeWidth="1.4" />
      <line x1="15" y1="46" x2="49" y2="46" stroke={STROKE} strokeWidth="1.5" opacity="0.5" />
    </Badge>
  );
}

function IconTruSoCoQuan({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#818CF8" to="#4338CA" shadow="#4338CA">
      <path d="M14 26 L32 16 L50 26" stroke={STROKE} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <line x1="14" y1="26" x2="50" y2="26" stroke={STROKE} strokeWidth="1.6" />
      <line x1="19" y1="29" x2="19" y2="42" stroke={STROKE} strokeWidth="1.5" />
      <line x1="27" y1="29" x2="27" y2="42" stroke={STROKE} strokeWidth="1.5" />
      <line x1="37" y1="29" x2="37" y2="42" stroke={STROKE} strokeWidth="1.5" />
      <line x1="45" y1="29" x2="45" y2="42" stroke={STROKE} strokeWidth="1.5" />
      <line x1="13" y1="46" x2="51" y2="46" stroke={STROKE} strokeWidth="1.7" strokeLinecap="round" />
    </Badge>
  );
}

function IconVanPhong({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#7C93B3" to="#3E5C87" shadow="#3E5C87">
      <rect x="16" y="9" width="20" height="42" rx="2.5" stroke={STROKE} strokeWidth="1.7" />
      <rect x="36" y="23" width="12" height="28" rx="2.5" stroke={STROKE} strokeWidth="1.5" opacity="0.7" />
      <circle cx="21.5" cy="19" r="1.3" fill={STROKE} />
      <circle cx="29" cy="19" r="1.3" fill={STROKE} opacity="0.55" />
      <circle cx="21.5" cy="27" r="1.3" fill={STROKE} opacity="0.55" />
      <circle cx="29" cy="27" r="1.3" fill={STROKE} opacity="0.55" />
      <circle cx="21.5" cy="35" r="1.3" fill={STROKE} opacity="0.55" />
      <circle cx="29" cy="35" r="1.3" fill={STROKE} opacity="0.55" />
    </Badge>
  );
}

function IconYTe({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#F87171" to="#DC2626" shadow="#DC2626">
      <rect x="17" y="16" width="30" height="32" rx="2.5" stroke={STROKE} strokeWidth="1.6" />
      <path d="M32 25 v14 M25 32 h14" stroke={STROKE} strokeWidth="2.2" strokeLinecap="round" />
    </Badge>
  );
}

function IconVuiChoiGiaiTri({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#E879F9" to="#A21CAF" shadow="#A21CAF">
      <circle cx="32" cy="23" r="9" stroke={STROKE} strokeWidth="1.6" />
      <path d="M32 32 l-2 4 l2 2 l2 -2 Z" stroke={STROKE} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
      <path d="M32 38 q3 6 0 12" stroke={STROKE} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </Badge>
  );
}

function IconBietThu({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#86EFAC" to="#16A34A" shadow="#16A34A">
      <path d="M16 30 L28 18 L40 30" stroke={STROKE} strokeWidth="1.7" fill="none" strokeLinejoin="round" />
      <rect x="18" y="30" width="20" height="16" stroke={STROKE} strokeWidth="1.6" />
      <rect x="24" y="36" width="8" height="10" stroke={STROKE} strokeWidth="1.4" />
      <circle cx="44" cy="34" r="5" stroke={STROKE} strokeWidth="1.4" opacity="0.8" />
      <line x1="44" y1="39" x2="44" y2="46" stroke={STROKE} strokeWidth="1.4" opacity="0.8" />
    </Badge>
  );
}

function IconNhaHangTiecCuoi({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#FCD34D" to="#B45309" shadow="#B45309">
      <path d="M22 16 v14 M22 16 q-3 0 -3 4 t3 4 M25 16 v10 q0 4 -3 4" stroke={STROKE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="22" y1="30" x2="22" y2="48" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M40 16 q4 4 4 10 q0 4 -4 4 v18" stroke={STROKE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Badge>
  );
}

function IconNhaPho({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#5EEAD4" to="#0D9488" shadow="#0D9488">
      <rect x="21" y="14" width="22" height="34" rx="2" stroke={STROKE} strokeWidth="1.6" />
      <line x1="21" y1="28" x2="43" y2="28" stroke={STROKE} strokeWidth="1.4" opacity="0.5" />
      <rect x="25" y="18" width="6" height="6" stroke={STROKE} strokeWidth="1.3" opacity="0.6" />
      <rect x="33" y="18" width="6" height="6" stroke={STROKE} strokeWidth="1.3" opacity="0.6" />
      <rect x="28" y="36" width="8" height="12" stroke={STROKE} strokeWidth="1.4" />
    </Badge>
  );
}

function IconChungCu({ className }: IllustrationProps) {
  return (
    <Badge className={className} from="#60A5FA" to="#1D4ED8" shadow="#1D4ED8">
      <rect x="20" y="12" width="24" height="36" rx="2" stroke={STROKE} strokeWidth="1.6" />
      <rect x="24" y="17" width="5" height="4" stroke={STROKE} strokeWidth="1.2" opacity="0.6" />
      <rect x="35" y="17" width="5" height="4" stroke={STROKE} strokeWidth="1.2" opacity="0.6" />
      <rect x="24" y="25" width="5" height="4" stroke={STROKE} strokeWidth="1.2" opacity="0.6" />
      <rect x="35" y="25" width="5" height="4" stroke={STROKE} strokeWidth="1.2" opacity="0.6" />
      <rect x="24" y="33" width="5" height="4" stroke={STROKE} strokeWidth="1.2" opacity="0.6" />
      <rect x="35" y="33" width="5" height="4" stroke={STROKE} strokeWidth="1.2" opacity="0.6" />
    </Badge>
  );
}

export function getProjectTypeIcon(slug?: string): Illustration {
  const s = slug ?? "";
  if (s.includes("can-ho-dich-vu")) return IconCanHoDichVu;
  if (s.includes("giao-duc")) return IconCoSoGiaoDuc;
  if (s.includes("kinh-doanh")) return IconCoSoKinhDoanh;
  if (s.includes("cong-nghiep")) return IconCongTrinhCongNghiep;
  if (s.includes("showroom")) return IconShowroom;
  if (s.includes("tru-so") || s.includes("co-quan")) return IconTruSoCoQuan;
  if (s.includes("van-phong")) return IconVanPhong;
  if (s.includes("y-te")) return IconYTe;
  if (s.includes("vui-choi") || s.includes("giai-tri")) return IconVuiChoiGiaiTri;
  if (s.includes("biet-thu")) return IconBietThu;
  if (s.includes("nha-hang") || s.includes("tiec-cuoi")) return IconNhaHangTiecCuoi;
  if (s.includes("nha-pho")) return IconNhaPho;
  if (s.includes("chung-cu")) return IconChungCu;
  return IconVanPhong;
}
