"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/categories": "Danh mục",
  "/admin/projects": "Dự án",
  "/admin/products": "Sản phẩm",
  "/admin/about": "Giới thiệu",
  "/admin/contacts": "Liên hệ",
  "/admin/branches": "Chi nhánh",
  "/admin/settings": "Cài đặt",
  "/admin/account": "Tài khoản của tôi",
};

export default function AdminBreadcrumb() {
  const pathname = usePathname();
  const label = routeLabels[pathname] ?? "Admin";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
        </BreadcrumbItem>
        {pathname !== "/admin" && (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
