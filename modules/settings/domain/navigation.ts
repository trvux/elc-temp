export interface NavLink {
  name: string;
  href: string;
}

export const navLinks: NavLink[] = [
  { name: "Trang chủ", href: "/" },
  { name: "Dự án", href: "/du-an" },
  { name: "Sản phẩm", href: "/san-pham" },
  { name: "Dịch vụ", href: "/dich-vu" },
  { name: "Cơ sở", href: "/chi-nhanh" },
  { name: "Tin tức", href: "/tin-tuc" },
  { name: "Thông tin", href: "/thong-tin" },
];

export function checkActiveLink(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
